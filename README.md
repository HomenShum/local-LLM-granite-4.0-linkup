---
title: Granite-4.0 WebGPU with Tool Calling
emoji: 🪨
colorFrom: indigo
colorTo: green
sdk: static
pinned: false
license: apache-2.0
app_build_command: npm run build
app_file: dist/index.html
thumbnail: >-
  https://huggingface.co/spaces/ibm-granite/Granite-4.0-WebGPU/resolve/main/public/banner.png
short_description: Run Granite-4.0-Micro 100% locally in your browser with web search and URL fetch capabilities
models:
- onnx-community/granite-4.0-micro-ONNX-web
- onnx-community/granite-4.0-micro-ONNX
---

# Granite-4.0 WebGPU with Tool Calling

Run Granite-4.0-Micro 100% locally in your browser with **tool calling** capabilities powered by [Linkup API](https://linkup.so).

## Features

- 🚀 **100% Local Inference**: Runs entirely in your browser using WebGPU
- 🔧 **Tool Calling**: Web search and URL fetch capabilities
- 🏦 **Financial Governance**: Optimized for financial compliance and regulatory queries
- 📊 **Real-time Data**: Access current information, regulations, and market data
- 🔒 **Privacy**: No data sent to servers (except tool API calls)

## Available Tools

### 1. Web Search
Search the web for current information using Linkup's search API.

**Example queries:**
- "What are the current Basel III capital requirements?"
- "Search for latest SEC climate disclosure rules"
- "Find Federal Reserve CCAR stress test scenarios for 2024"

### 2. URL Fetch
Fetch and extract content from specific URLs.

**Example queries:**
- "Fetch content from https://www.sec.gov/rules/final/2024/example.html"
- "Read the latest Basel Committee publication"

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Testing

Run the comprehensive test suite for financial governance scenarios:

```bash
# Start dev server
npm run dev

# Open test runner
# Navigate to: http://localhost:5173/tests/run-scenarios.html
```

The test suite includes 10 scenarios covering:
- Basel III Capital Requirements
- SEC Reporting Requirements
- Dodd-Frank Stress Testing
- ESG Disclosure Requirements
- And more...

## Documentation

- [Tool Calling Guide](./TOOL_CALLING.md) - Complete documentation on tool calling
- [Test Scenarios](./tests/financial-governance-scenarios.js) - 10 comprehensive test cases
- [Linkup API Docs](https://docs.linkup.so) - Linkup API reference

## Configuration

**Required:** Set up your Linkup API key to enable tool calling.

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```bash
   VITE_LINKUP_API_KEY=your_actual_api_key_here
   VITE_ENABLE_TOOLS=true
   ```

3. Get your API key from [Linkup Dashboard](https://app.linkup.so)

4. Restart the dev server to load the environment variables

## Architecture

```
src/
├── utils/
│   ├── linkupApi.js       # Linkup API integration
│   └── tools.js           # Tool definitions and execution
├── worker.js              # WebGPU worker with tool calling
├── App.jsx                # Main application
└── components/
    └── Chat.jsx           # Chat interface with tool indicators
```

## License

Apache 2.0

## References

- [Granite Model](https://huggingface.co/ibm-granite/granite-4.0-micro)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [Linkup API](https://linkup.so)

Tool Call:


Chat History:
- KV cache

Context Management:
