/**
 * Tool Definitions and Execution Module
 * Defines available tools and handles their execution
 */

import {
  webSearch,
  fetchUrlContent,
  formatSearchResult,
  formatFetchResult,
} from "./linkupApi.js";

/**
 * Tool definitions in the format expected by Granite model
 */
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information, news, financial data, regulations, compliance requirements, market trends, or any other real-time information. Use this when you need up-to-date information that may not be in your training data. Particularly useful for financial governance, regulatory compliance, market analysis, and current events.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query. Be specific and detailed for best results. Include relevant keywords like company names, dates, financial terms, or regulatory frameworks.",
          },
          depth: {
            type: "string",
            enum: ["standard", "deep"],
            description:
              "Search depth: 'standard' for faster results, 'deep' for more comprehensive results. Default is 'standard'.",
            default: "standard",
          },
          includeDomains: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional: Limit search to specific domains (e.g., ['sec.gov', 'federalreserve.gov'] for regulatory information)",
          },
          excludeDomains: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional: Exclude specific domains from search results",
          },
          fromDate: {
            type: "string",
            description:
              "Optional: Start date for results in ISO 8601 format (YYYY-MM-DD)",
          },
          toDate: {
            type: "string",
            description:
              "Optional: End date for results in ISO 8601 format (YYYY-MM-DD)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url_content",
      description:
        "Fetch and extract the content from a specific URL. Use this when you have a specific webpage URL and need to read its content. Returns the page content in markdown format. Useful for reading financial reports, regulatory documents, company filings, or any specific webpage.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The full URL of the webpage to fetch (must start with http:// or https://)",
          },
          renderJs: {
            type: "boolean",
            description:
              "Whether to render JavaScript on the page before extracting content. Set to true for dynamic pages. Default is false.",
            default: false,
          },
          extractImages: {
            type: "boolean",
            description:
              "Whether to extract image URLs from the page. Default is false.",
            default: false,
          },
        },
        required: ["url"],
      },
    },
  },
];

/**
 * Execute a tool call
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} Tool execution result
 */
export async function executeTool(toolName, args) {
  console.log(`Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case "web_search": {
        const result = await webSearch(args.query, {
          depth: args.depth || "standard",
          includeDomains: args.includeDomains || [],
          excludeDomains: args.excludeDomains || [],
          fromDate: args.fromDate || null,
          toDate: args.toDate || null,
        });
        return {
          success: true,
          toolName,
          result: formatSearchResult(result),
          rawResult: result,
        };
      }

      case "fetch_url_content": {
        const result = await fetchUrlContent(args.url, {
          renderJs: args.renderJs || false,
          extractImages: args.extractImages || false,
        });
        return {
          success: true,
          toolName,
          result: formatFetchResult(result),
          rawResult: result,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return {
      success: false,
      toolName,
      error: error.message,
      result: `Error executing ${toolName}: ${error.message}`,
    };
  }
}

/**
 * Parse tool calls from model output
 * Supports both:
 *  - XML-wrapped calls: <tool_call>{"name":..., "arguments": {...}}</tool_call>
 *  - Raw JSON calls: {"name":..., "arguments": {...}} optionally followed by special tokens
 * Uses a brace-balancing extractor to avoid regex pitfalls with nested objects.
 * @param {string} text - Model output text
 * @returns {Array<{name: string, arguments: Object}>} Array of parsed tool calls
 */
export function parseToolCalls(text) {
  if (!text || typeof text !== "string") return [];

  // Remove common special tokens that may trail the JSON
  const cleaned = text.replace(/<\|end_of_text\|>/g, "").trim();

  const results = [];

  // Helper: extract a balanced JSON object starting at index pointing to '{'
  function extractBalancedJson(s, startIndex) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = startIndex; i < s.length; i++) {
      const ch = s[i];

      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const jsonStr = s.slice(startIndex, i + 1);
          try {
            const obj = JSON.parse(jsonStr);
            return { end: i + 1, obj, raw: jsonStr };
          } catch (e) {
            // If parse fails, return null to allow fallback
            return null;
          }
        }
      }
    }
    return null;
  }

  // 1) Parse explicit <tool_call> ... </tool_call> blocks
  const tagRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
  let m;
  while ((m = tagRegex.exec(cleaned)) !== null) {
    const inner = m[1].trim();

    // Ignore placeholder or example content often shown in docs
    if (/<function-name>|<args-json-object>|<[^>]+>/.test(inner)) {
      console.warn("Ignoring placeholder <tool_call> block (looks like docs/example)");
      continue;
    }

    const braceIndex = inner.indexOf("{");
    if (braceIndex !== -1) {
      const extracted = extractBalancedJson(inner, braceIndex);
      if (extracted && extracted.obj && extracted.obj.name && extracted.obj.arguments !== undefined) {
        results.push(extracted.obj);
      } else if (extracted === null) {
        console.warn("Failed to parse tool call inside <tool_call> tags (non-JSON content)");
      }
    }
  }

  // 2) If none found, search for raw JSON objects that look like tool calls
  if (results.length === 0) {
    let idx = 0;
    while ((idx = cleaned.indexOf('{"name"', idx)) !== -1) {
      const extracted = extractBalancedJson(cleaned, idx);
      if (extracted && extracted.obj) {
        const obj = extracted.obj;
        if (obj && typeof obj === "object" && obj.name && obj.arguments !== undefined) {
          results.push(obj);
        }
        idx = extracted.end;
      } else {
        idx += 1; // move forward to avoid infinite loop
      }
    }
  }

  return results;
}

/**
 * Format tool result for model consumption
 * @param {string} toolName - Name of the tool
 * @param {Object} result - Tool execution result
 * @returns {string} Formatted result for the model
 */
export function formatToolResultForModel(toolName, result) {
  if (result.success) {
    return `<tool_result>
Tool: ${toolName}
Result: ${result.result}
</tool_result>`;
  } else {
    return `<tool_result>
Tool: ${toolName}
Error: ${result.error}
</tool_result>`;
  }
}

