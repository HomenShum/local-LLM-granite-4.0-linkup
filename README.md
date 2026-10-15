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

# Granite WebGPU browser demo

This React/Vite prototype runs Granite inference in a browser worker and connects its search and URL-fetch tools to Linkup. A developer evaluating this copy should distinguish local model execution, remote tool requests and simulated test output before using it as an application foundation.

**Current handoff: 2026-10-15.** Source was inspected at `d399954`; startup, model quality, browser compatibility, CI and deployment were not revalidated by this documentation update.

## Start here

- [Credential and data boundary](SECURITY.md): browser-held keys and remote requests.
- [Tool flow](TOOL_CALLING.md): definitions, execution and limitations.
- [Scenario simulation](tests/run-scenarios.html) and [fixture/validator source](tests/financial-governance-scenarios.js): useful for inspecting the runner, without proving real tool use.
- [Historical deployment note](DEPLOYMENT_READY.md) and [historical implementation report](IMPLEMENTATION_SUMMARY.md): preserved old claims, not current readiness receipts.

## Local setup

Clone this repository, then use its lockfile:

```bash
git clone https://github.com/HomenShum/local-LLM-granite-4.0-linkup.git
cd local-LLM-granite-4.0-linkup
npm ci
npm run dev
```

Open the address Vite prints. Node.js and npm are required. [package.json](package.json) declares no Node `engines`; locked Vite 6.3.6 declares `^18.0.0 || ^20.0.0 || >=22.0.0` in [package-lock.json](package-lock.json). Those are source declarations, not tested-version results from this update.

The worker requests a WebGPU adapter with `shader-f16` support. Its model/tokenizer loading uses Transformers.js `from_pretrained`; network, download and cache behavior still need verification on the target browser. An installed frontend does not prove the model can run on that device.

Other declared commands are `npm run build`, `npm run preview` and `npm run lint`. No `npm test` script is declared. These commands were not executed for this documentation-only change.

## Credentials and outbound data

[src/utils/linkupApi.js](src/utils/linkupApi.js) reads `import.meta.env.VITE_LINKUP_API_KEY` and sends it as a Bearer credential directly from browser code to Linkup. Search queries and selected URLs are included in those remote requests. Local inference does not make the tool requests local.

A key supplied through `VITE_LINKUP_API_KEY` is **available to the browser user**. Keeping an environment file out of Git or setting a hosting-platform secret does not make a value bundled into client code confidential. Do not publish this design with a shared secret that visitors must not learn. A trusted server boundary for that use is not implemented here. See [SECURITY.md](SECURITY.md) before configuring a key.

The tool module logs a missing-key warning when no usable key is supplied. The source does not read `VITE_ENABLE_TOOLS`; that old documented variable is not a supported tool-disable control.

## What the tests establish

The financial-governance prompts are example use cases. This documentation update establishes no compliance-accuracy or model-optimization result.

The page at `/tests/run-scenarios.html` is a **simulation**. It supplies `scenario.expectedTools` as `toolsCalled` and constructs a mock final response, instead of running the model worker. Its green result or exported JSON does not prove a model generated a tool call, Linkup was contacted, or an answer was correct.

It imports the ten-case financial array. Two additional multi-tool fixtures exist in the scenario module but are not imported by that page. The validator rejects missing expected tool names; answer criteria only add warnings. In a source inspection, all ten cases also accepted caller-supplied expected names with an empty answer and no worker execution. This demonstrates the validator's limit, not an application success rate.

The separate [CLI smoke script](tests/run-smoke-test.mjs) reads `LINKUP_API_KEY`, makes real API requests and currently logs a key prefix. Do not publish its output or run it in shared logs with a private key. Neither the live smoke script nor the model/worker was exercised for this update.

## Source map

| File | Responsibility |
|---|---|
| [src/App.jsx](src/App.jsx) | Creates the browser worker and handles its status messages |
| [src/worker.js](src/worker.js) | Checks GPU support and runs model/tool iterations |
| [src/utils/tools.js](src/utils/tools.js) | Tool schemas, parser and execution dispatch |
| [src/utils/linkupApi.js](src/utils/linkupApi.js) | Direct authenticated Linkup requests and result formatting |
| [tests/run-scenarios.html](tests/run-scenarios.html) | Simulated scenario display and export |
| [tests/financial-governance-scenarios.js](tests/financial-governance-scenarios.js) | Ten financial fixtures, two extra multi-tool fixtures and validator |

## Documentation change record

**2026-10-15:** Corrected the credential boundary and test-evidence claims, added first-run navigation and source prerequisites, and separated inherited reports from current verification. Runtime, dependencies, model selection and test behavior remain unchanged. Related corrections: [security](SECURITY.md), [tools](TOOL_CALLING.md), [deployment history](DEPLOYMENT_READY.md), [implementation history](IMPLEMENTATION_SUMMARY.md).

The preserved hosting frontmatter declares `apache-2.0`; this source snapshot has no standalone `LICENSE` file.
