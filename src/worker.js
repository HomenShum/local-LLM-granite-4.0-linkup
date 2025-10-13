import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

import { TOOLS, executeTool, parseToolCalls, formatToolResultForModel } from "./utils/tools.js";

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU is not supported (no adapter found)");
    }
    if (!adapter.features.has("shader-f16")) {
      throw new Error("WebGPU adapter does not support shader-f16");
    }
  } catch (e) {
    self.postMessage({
      status: "error",
      data: e.toString(),
    });
  }
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */
class TextGenerationPipeline {
  static model_id = "onnx-community/granite-4.0-micro-ONNX-web";

  static async getInstance(progress_callback = null) {
    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
      dtype: "q4f16",
      device: "webgpu",
      progress_callback,
    });

    return Promise.all([this.tokenizer, this.model]);
  }
}

const stopping_criteria = new InterruptableStoppingCriteria();

let past_key_values_cache = null;

/**
 * Generate a single response from the model
 */
async function generateSingleResponse(tokenizer, model, messages, useTools = true) {
  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
    tools: useTools ? TOOLS : undefined,
  });

  let startTime;
  let numTokens = 0;
  let tps;
  const token_callback_function = () => {
    startTime ??= performance.now();

    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
  };
  const callback_function = (output) => {
    self.postMessage({
      status: "update",
      output,
      tps,
      numTokens,
    });
  };

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: false, // Keep special tokens to detect tool calls
    callback_function,
    token_callback_function,
  });

  let genResult;
  try {
    genResult = await model.generate({
      ...inputs,
      past_key_values: past_key_values_cache,

      // Sampling
      // do_sample: true,
      // top_k: 3,
      // temperature: 0.2,

      max_new_tokens: 1024,
      streamer,
      stopping_criteria,
      return_dict_in_generate: true,
    });
  } catch (err) {
    // Handle potential WebGPU/ONNX device loss or stale buffer references
    const msg = String(err?.message || err);
    if (
      err?.name === "AbortError" ||
      /valid external Instance reference no longer exists/i.test(msg)
    ) {
      console.warn("Model.generate failed due to device/buffer issue. Resetting cache and retrying once.");
      past_key_values_cache = null;
      genResult = await model.generate({
        ...inputs,
        max_new_tokens: 1024,
        streamer,
        stopping_criteria,
        return_dict_in_generate: true,
      });
    } else {
      throw err;
    }
  }

  const { past_key_values, sequences } = genResult;
  past_key_values_cache = past_key_values;

  const decoded = tokenizer.batch_decode(sequences, {
    skip_special_tokens: false,
  });

  return { decoded, tps, numTokens };
}

/**
 * Main generate function with tool calling support
 */
async function generate(messages, enableTools = true) {
  // Retrieve the text-generation pipeline.
  const [tokenizer, model] = await TextGenerationPipeline.getInstance();

  // Ensure we don't reuse stale GPU buffers between user requests
  past_key_values_cache = null;

  // Tell the main thread we are starting
  self.postMessage({ status: "start" });

  let conversationMessages = [...messages];
  let maxToolIterations = 5; // Prevent infinite loops
  let iteration = 0;
  let allowTools = enableTools; // we may disable tools after first successful round

  while (iteration < maxToolIterations) {
    iteration++;

    // Generate response
    const { decoded, tps, numTokens } = await generateSingleResponse(
      tokenizer,
      model,
      conversationMessages,
      allowTools
    );

    const responseText = decoded[0];

    // Check for tool calls
    const toolCalls = allowTools ? parseToolCalls(responseText) : [];

    if (toolCalls.length === 0) {
      // No tool calls, we're done
      // Clean up the response text by removing special tokens
      const cleanedResponse = responseText
        .replace(/<\|start_of_role\|>.*?<\|end_of_role\|>/g, "")
        .replace(/<\|end_of_text\|>/g, "")
        .trim();

      self.postMessage({
        status: "complete",
        output: [cleanedResponse],
        tps,
        numTokens,
      });
      return;
    }

    // Execute tool calls
    self.postMessage({
      status: "tool_calling",
      tools: toolCalls.map((tc) => tc.name),
    });

    const toolResults = [];
    for (const toolCall of toolCalls) {
      try {
        const result = await executeTool(toolCall.name, toolCall.arguments);
        toolResults.push(formatToolResultForModel(toolCall.name, result));

        // Send tool result to UI
        self.postMessage({
          status: "tool_result",
          toolName: toolCall.name,
          result: result.result,
          success: result.success,
        });
      } catch (error) {
        console.error("Tool execution error:", error);
        toolResults.push(
          formatToolResultForModel(toolCall.name, {
            success: false,
            error: error.message,
          })
        );
      }
    }

    // Add assistant's response with tool calls and tool results to conversation
    conversationMessages.push({
      role: "assistant",
      content: responseText,
    });

    // Add explicit instruction to produce a final answer using tool results
    conversationMessages.push({
      role: "user",
      content:
        "The tools above have been executed. Using ONLY the <tool_result> content, provide a concise, well-structured answer to the user's last request. Include brief citations to the most relevant sources. Do not call tools again unless strictly necessary.\n\n" +
        toolResults.join("\n\n"),
    });

    // After one successful tool round, disable further tool calls to force a final answer
    allowTools = false;
  }

  // If we hit max iterations, send what we have
  self.postMessage({
    status: "complete",
    output: ["Maximum tool iterations reached. Please try rephrasing your question."],
  });
}

async function load() {
  self.postMessage({
    status: "loading",
    data: "Loading model...",
  });

  // Load the pipeline and save it for future use.
  const [tokenizer, model] = await TextGenerationPipeline.getInstance((x) => {
    // We also add a progress callback to the pipeline so that we can
    // track model loading.
    self.postMessage(x);
  });

  self.postMessage({
    status: "loading",
    data: "Compiling shaders and warming up model...",
  });

  // Run model with dummy input to compile shaders
  const inputs = tokenizer("a");
  await model.generate({ ...inputs, max_new_tokens: 1 });
  self.postMessage({ status: "ready" });
}
// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  const { type, data, enableTools } = e.data;

  switch (type) {
    case "check":
      check();
      break;

    case "load":
      load();
      break;

    case "generate":
      stopping_criteria.reset();
      generate(data, enableTools !== false); // Default to true
      break;

    case "interrupt":
      stopping_criteria.interrupt();
      break;

    case "reset":
      past_key_values_cache = null;
      stopping_criteria.reset();
      break;
  }
});
