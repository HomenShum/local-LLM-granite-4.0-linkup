# Tool Calling with Linkup API

This document describes the tool calling functionality integrated into the Granite-4.0-WebGPU application.

**2026-10-15 source correction:** This is a browser demo with direct remote Linkup requests. The supplied Vite key is available to the browser user; see [SECURITY.md](SECURITY.md). The financial prompts below are examples, not newly evaluated compliance results.

## Overview

The Granite-4.0 model has been enhanced with tool calling capabilities, allowing it to:
- **Search the web** for current information using Linkup's search API
- **Fetch webpage content** from specific URLs using Linkup's fetch API

This enables the model to access real-time information, making it particularly useful for:
- Financial governance and compliance queries
- Regulatory research
- Market analysis
- Current events and news
- Company filings and reports

## Available Tools

### 1. web_search

Searches the web for current information.

**Parameters:**
- `query` (required): The search query
- `depth` (optional): "standard" (faster) or "deep" (more comprehensive)
- `includeDomains` (optional): Array of domains to limit search to
- `excludeDomains` (optional): Array of domains to exclude
- `fromDate` (optional): Start date in ISO 8601 format (YYYY-MM-DD)
- `toDate` (optional): End date in ISO 8601 format (YYYY-MM-DD)

**Example:**
```
User: What are the current Basel III capital requirements?

Model calls: web_search({
  "query": "Basel III minimum capital requirements 2024",
  "includeDomains": ["bis.org", "federalreserve.gov"]
})
```

### 2. fetch_url_content

Fetches and extracts content from a specific URL.

**Parameters:**
- `url` (required): The full URL to fetch
- `renderJs` (optional): Whether to render JavaScript (default: false)
- `extractImages` (optional): Whether to extract image URLs (default: false)

**Example:**
```
User: Read the content from https://www.sec.gov/rules/final/2024/example.html

Model calls: fetch_url_content({
  "url": "https://www.sec.gov/rules/final/2024/example.html",
  "renderJs": false
})
```

## How It Works

### 1. Tool Call Detection

When the model generates a response, the system checks for `<tool_call>` tags:

```xml
<tool_call>
{"name": "web_search", "arguments": {"query": "Basel III requirements"}}
</tool_call>
```

### 2. Tool Execution

The system:
1. Parses the tool call JSON
2. Executes the appropriate function (web_search or fetch_url_content)
3. Calls the Linkup API with the provided parameters
4. Formats the result

### 3. Result Integration

The tool result is fed back to the model:

```xml
<tool_result>
Tool: web_search
Result: [Formatted search results with answer and sources]
</tool_result>
```

### 4. Final Response

The model uses the tool results to generate a comprehensive answer to the user's question.

## Configuration

### API Key Setup

Read the [credential boundary](SECURITY.md) before supplying a key. A hosting secret or Git-ignored environment file does not make a browser-held credential private. This source does not read `VITE_ENABLE_TOOLS`; it is not a supported disable switch.

**Required:** You must configure your Linkup API key before using tool calling features.

1. **Get your API key** from [Linkup Dashboard](https://app.linkup.so)

2. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and add your API key:**
   ```bash
   VITE_LINKUP_API_KEY=your_actual_api_key_here
   ```

4. **Restart the dev server** to load the new environment variables:
   ```bash
   npm run dev
   ```

### For Node.js Tests

The separate smoke script makes real API calls and logs a key prefix. Do not publish its output or run it in shared logs with a private key; see [the log boundary](SECURITY.md#test-and-log-boundaries). It was not run for this update.

When running smoke tests from the command line, set the environment variable:

```bash
# Option 1: Inline
LINKUP_API_KEY=your_key node tests/run-smoke-test.mjs

# Option 2: Export in shell
export LINKUP_API_KEY=your_key
node tests/run-smoke-test.mjs
```

**Security Note:** The `.env` file is in `.gitignore` to prevent committing API keys to version control.

## UI Indicators

The chat interface shows:

### Tool Calling Indicator
```
🔧 Calling tools: web_search, fetch_url_content
```

### Tool Results
```
✓ web_search
  Result: [First 200 characters of result...]

✓ fetch_url_content
  Result: [First 200 characters of content...]
```

### Error Handling
```
✗ web_search
  Error: Failed to perform web search: API rate limit exceeded
```

## Architecture

### File Structure

```
src/
├── utils/
│   ├── linkupApi.js       # Linkup API integration
│   └── tools.js           # Tool definitions and execution
├── worker.js              # Updated with tool calling logic
├── App.jsx                # Updated to handle tool status
└── components/
    └── Chat.jsx           # Updated to display tool info

tests/
├── financial-governance-scenarios.js  # Test scenarios
└── run-scenarios.html                 # Test runner UI
```

### Key Components

#### linkupApi.js
- `webSearch()`: Calls Linkup search API
- `fetchUrlContent()`: Calls Linkup fetch API
- `formatSearchResult()`: Formats search results
- `formatFetchResult()`: Formats fetched content

#### tools.js
- `TOOLS`: Array of tool definitions
- `executeTool()`: Executes a tool by name
- `parseToolCalls()`: Parses tool calls from model output
- `formatToolResultForModel()`: Formats results for the model

#### worker.js
- `generateSingleResponse()`: Generates one model response
- `generate()`: Main loop with tool calling support
- Handles tool call detection and execution
- Manages conversation state with tool results

## Testing

### Test Scenarios

Ten financial-governance fixtures plus two additional multi-tool fixtures are defined in:
`tests/financial-governance-scenarios.js`

Scenarios cover:
1. Basel III Capital Requirements
2. SEC Reporting Requirements
3. Credit Risk Weighted Assets
4. Dodd-Frank Stress Testing
5. ESG Disclosure Requirements
6. Liquidity Coverage Ratio (LCR)
7. Anti-Money Laundering (AML)
8. Portfolio Diversification
9. Loan-to-Value (LTV) Ratios
10. Stress Testing Scenarios

### Running the simulation

The browser page below supplies expected tool names as observed results and creates a mock answer; it never calls the worker. Its green status and exported results are simulation output, not evidence of real model/tool execution. It imports only the ten-case financial array, not the two extra multi-tool fixtures. Answer criteria add warnings rather than failing the scenario.

1. **Open the test runner:**
   ```bash
   # Start the dev server
   npm run dev
   
   # Navigate to:
   http://localhost:5173/tests/run-scenarios.html
   ```

2. **Run all scenarios:**
   - Click "▶️ Run All Scenarios"

3. **Run selected scenarios:**
   - Check/uncheck scenarios
   - Click "▶️ Run Selected"

4. **Export results:**
   - Click "💾 Export Results" to download JSON

### Manual Testing

Example queries to test:

```
1. "What are the current Basel III minimum capital requirements?"

2. "Search for the latest SEC climate disclosure rules"

3. "What is the Liquidity Coverage Ratio requirement under Basel III?"

4. "Find information about FinCEN SAR filing requirements"

5. "Search for Federal Reserve CCAR stress test scenarios for 2024"
```

## Limitations

### Current Limitations

1. **Max Tool Iterations**: 5 iterations to prevent infinite loops
2. **No Streaming During Tool Calls**: Tool execution pauses streaming
3. **Sequential Tool Execution**: Tools are executed one at a time
4. **No Tool Result Caching**: Each query re-executes tools

### API Limitations

- **Linkup API Rate Limits**: Check your plan limits
- **Search Depth**: "deep" searches take longer
- **URL Fetch**: Some sites may block automated access

## Best Practices

### For Users

1. **Be Specific**: Detailed queries get better results
   - ❌ "Tell me about regulations"
   - ✅ "What are the Basel III Tier 1 capital requirements for banks in 2024?"

2. **Specify Domains**: For regulatory queries, suggest specific domains
   - "Search sec.gov for climate disclosure rules"

3. **Use Date Ranges**: For time-sensitive information
   - "Search for Federal Reserve announcements from January 2024 to March 2024"

### For Developers

1. **Error Handling**: Always handle API errors gracefully
2. **Rate Limiting**: Implement exponential backoff
3. **Result Validation**: Validate tool results before using
4. **Security**: The current `VITE_LINKUP_API_KEY` reaches browser code. Environment variables and Git exclusion do not hide it from visitors; use the [current credential boundary](SECURITY.md) when deciding whether to host this design.

## Troubleshooting

### Tool Not Called

**Problem**: Model doesn't call tools when expected

**Solutions**:
- Make query more explicit: "Search for..."
- Check if tools are enabled in worker
- Verify model has tool definitions

### API Errors

**Problem**: Linkup API returns errors

**Solutions**:
- Check API key is valid
- Verify rate limits not exceeded
- Check network connectivity
- Validate request parameters

### Incomplete Results

**Problem**: Tool results seem incomplete

**Solutions**:
- Try "deep" search instead of "standard"
- Adjust date ranges
- Try different search terms
- Check if domain restrictions are too narrow

## Future Enhancements

Potential improvements:

1. **Parallel Tool Execution**: Execute multiple tools simultaneously
2. **Tool Result Caching**: Cache results to reduce API calls
3. **Streaming Tool Results**: Stream tool results as they arrive
4. **Custom Tools**: Allow users to define custom tools
5. **Tool Chaining**: Automatically chain related tools
6. **Result Ranking**: Rank and filter tool results by relevance

## References

- [Linkup API Documentation](https://docs.linkup.so)
- [Granite Model Card](https://huggingface.co/ibm-granite/granite-4.0-micro)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Tool Calling Guide](https://huggingface.co/docs/transformers/main/en/chat_templating#automated-function-conversion-for-tool-use)


## Documentation change record

**2026-10-15:** Corrected browser-key secrecy and scenario-evidence claims, removed the unsupported tool-disable setting from current setup, and disclosed CLI key-prefix logging. Runtime and tests remain unchanged. Related corrections: [README](README.md), [security](SECURITY.md), [deployment history](DEPLOYMENT_READY.md) and [implementation history](IMPLEMENTATION_SUMMARY.md).
