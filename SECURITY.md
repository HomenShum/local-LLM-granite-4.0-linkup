# Credential and data boundary

A developer deciding whether to publish this demo needs to know who can read its tool credential. The current browser sends requests directly to Linkup, so a credential needed by that browser is available to its user.

**Reviewed source: 2026-10-15, revision `d399954`.** This document corrects the previous environment-variable secrecy advice. It does not certify the app, hosting configuration or past key handling.

## Browser configuration is visible to visitors

[src/utils/linkupApi.js](src/utils/linkupApi.js) reads `import.meta.env.VITE_LINKUP_API_KEY` and sends it in the Authorization header to Linkup's search and fetch endpoints. [App.jsx](src/App.jsx) creates the worker, which imports [tools.js](src/utils/tools.js), which imports that API module.

[Vite exposes `VITE_` variables in client source](https://vite.dev/guide/env-and-mode). A hosting-platform secret supplied to a static frontend build does not remain server-only after its value is bundled.

- Git exclusion protects an environment file from ordinary commits; it does not protect a key delivered to a visitor's browser.
- Do not use a shared private credential in a publicly served build of this design.
- Keeping a credential private from visitors requires an implemented trusted server boundary. This repository's current direct-browser requests do not provide one.
- Never commit actual credentials or paste them into issues, screenshots, exported results or logs.

For local source exploration, no credential needs to be entered. Real tool requests need a Linkup credential; review the exposure above before supplying `VITE_LINKUP_API_KEY` through local Vite configuration. The source does not use `VITE_ENABLE_TOOLS` as a disable switch.

## What leaves the browser

The search request sends the query and selected options. URL fetching sends the selected URL and fetch options. Both send the Bearer credential to Linkup. Model execution in the worker does not make those requests local or establish an end-to-end privacy guarantee.

This review inspected source call sites. It did not inspect an actual key, built bundle, browser request, provider account or deployment.

## Test and log boundaries

The browser page [tests/run-scenarios.html](tests/run-scenarios.html) is a simulation: it creates mock output from expected tool names and does not call the worker. Its pass display cannot certify credential safety or real tool execution.

The separate [tests/run-smoke-test.mjs](tests/run-smoke-test.mjs) reads the process variable `LINKUP_API_KEY`, makes real API calls and currently logs the first 20 characters of that value. Treat that output as sensitive. Do not run it in shared logs with a private credential or publish its output. This documentation update does not fix the script's logging.

No provider test was run for this review. Historical test counts and latency measurements in the [implementation report](IMPLEMENTATION_SUMMARY.md) remain historical.

## If a credential has been exposed

Revoke it through the provider and review its use before issuing a replacement. Removing a tracked file or changing an environment setting does not invalidate a credential already copied by someone else. Do not include the credential when reporting the issue.

## Documentation change record

**2026-10-15:** Replaced misleading browser-secret and secure-test guidance with the current caller, data and logging boundaries. No key value was read, no provider request was made, and no runtime protection was added. Related corrections: [README](README.md), [tool guide](TOOL_CALLING.md), [deployment history](DEPLOYMENT_READY.md) and [implementation history](IMPLEMENTATION_SUMMARY.md).
