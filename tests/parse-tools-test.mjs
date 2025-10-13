import { parseToolCalls } from "../src/utils/tools.js";

function testCase(name, input) {
  const result = parseToolCalls(input);
  console.log(`\n=== ${name} ===`);
  console.log("Input:\n", input);
  console.log("Parsed:", JSON.stringify(result, null, 2));
}

// Case 1: XML-wrapped single tool call
const input1 = `<tool_call>
{"name": "web_search", "arguments": {"query": "ibm granite 4.0 latest development", "depth": "deep"}}
</tool_call>`;

// Case 2: Raw JSON + special token
const input2 = '{"name": "web_search", "arguments": {"query": "ibm granite 4.0 latest development", "depth": "deep"}}<|end_of_text|>';

// Case 3: Multiple tool calls
const input3 = `<tool_call>{"name": "web_search", "arguments": {"query": "basel iii lcr", "depth": "standard"}}</tool_call>\nSome text...\n<tool_call>{"name": "fetch_url_content", "arguments": {"url": "https://www.bis.org/"}}</tool_call>`;

// Case 4: Nested JSON in arguments
const input4 = `<tool_call>{"name":"web_search","arguments": {"query": "news", "filters": {"region": "us", "date": {"from": "2024-01-01", "to": "2024-12-31"}}}}</tool_call>`;

// Case 5: No tool calls
const input5 = "Hello, I don't need tools.";

[testCase("XML-wrapped", input1),
 testCase("Raw JSON + token", input2),
 testCase("Multiple calls", input3),
 testCase("Nested JSON", input4),
 testCase("No calls", input5)];

