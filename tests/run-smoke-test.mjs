#!/usr/bin/env node

/**
 * Node.js Test Runner for Smoke Tests
 * Run with: LINKUP_API_KEY=your_key node tests/run-smoke-test.mjs
 * Or set LINKUP_API_KEY in your environment
 */

const LINKUP_API_KEY = process.env.LINKUP_API_KEY;
const LINKUP_BASE_URL = "https://api.linkup.so/v1";

// Validate API key
if (!LINKUP_API_KEY) {
  console.error("❌ Error: LINKUP_API_KEY environment variable not set.");
  console.error("Usage: LINKUP_API_KEY=your_key node tests/run-smoke-test.mjs");
  process.exit(1);
}

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, "cyan");
  console.log("=".repeat(80) + "\n");
}

async function webSearch(query, options = {}) {
  const { depth = "standard", includeDomains = [] } = options;

  const requestBody = {
    q: query,
    depth,
    outputType: "sourcedAnswer",
    includeImages: false,
    ...(includeDomains.length > 0 && { includeDomains }),
  };

  const response = await fetch(`${LINKUP_BASE_URL}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Linkup API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

async function fetchUrlContent(url) {
  const requestBody = {
    url,
    includeRawHtml: false,
    renderJs: false,
    extractImages: false,
  };

  const response = await fetch(`${LINKUP_BASE_URL}/fetch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Linkup API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

const TEST_SCENARIOS = [
  {
    id: 1,
    name: "Basel III Capital Requirements",
    query:
      "What are the current Basel III minimum capital requirements for Tier 1 capital ratio and total capital ratio for banks in 2024?",
    tool: "web_search",
    domains: ["bis.org", "federalreserve.gov"],
    keywords: ["tier", "capital", "basel"],
  },
  {
    id: 2,
    name: "SEC Reporting Requirements",
    query:
      "What are the SEC filing deadlines for Form 10-K and Form 10-Q for large accelerated filers in 2024?",
    tool: "web_search",
    domains: ["sec.gov"],
    keywords: ["10-k", "10-q", "deadline"],
  },
  {
    id: 3,
    name: "Dodd-Frank Stress Testing",
    query:
      "What are the current Dodd-Frank stress testing requirements for banks with over $100 billion in assets?",
    tool: "web_search",
    domains: ["federalreserve.gov"],
    keywords: ["ccar", "stress", "dodd-frank"],
  },
  {
    id: 4,
    name: "Liquidity Coverage Ratio",
    query:
      "What is the minimum Liquidity Coverage Ratio (LCR) requirement under Basel III?",
    tool: "web_search",
    domains: ["bis.org", "federalreserve.gov"],
    keywords: ["lcr", "liquidity", "hqla"],
  },
  {
    id: 5,
    name: "AML Compliance Requirements",
    query:
      "What are the current FinCEN requirements for Suspicious Activity Reports (SARs) and Currency Transaction Reports (CTRs)?",
    tool: "web_search",
    domains: ["fincen.gov"],
    keywords: ["sar", "ctr", "fincen"],
  },
];

async function runTest(scenario) {
  logSection(`TEST ${scenario.id}: ${scenario.name}`);

  try {
    log(`Query: ${scenario.query}`, "blue");
    log(`Tool: ${scenario.tool}`, "cyan");

    const startTime = Date.now();
    let result;

    if (scenario.tool === "web_search") {
      result = await webSearch(scenario.query, {
        depth: "standard",
        includeDomains: scenario.domains || [],
      });
    } else if (scenario.tool === "fetch_url_content") {
      const urlMatch = scenario.query.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        result = await fetchUrlContent(urlMatch[0]);
      }
    }

    const duration = Date.now() - startTime;

    log(`✓ Completed in ${duration}ms`, "green");

    // Display result
    if (result.answer) {
      log(`\nAnswer (first 300 chars):`, "yellow");
      log(result.answer.substring(0, 300) + "...", "reset");
    }

    if (result.sources && result.sources.length > 0) {
      log(`\nSources (${result.sources.length} total):`, "yellow");
      result.sources.slice(0, 3).forEach((source, i) => {
        log(`  ${i + 1}. ${source.name}`, "reset");
        log(`     ${source.url}`, "blue");
      });
    }

    // Validate keywords
    if (scenario.keywords) {
      log(`\nKeyword Validation:`, "yellow");
      const text = (result.answer || result.markdown || "").toLowerCase();
      scenario.keywords.forEach((keyword) => {
        const found = text.includes(keyword.toLowerCase());
        log(
          `  ${found ? "✓" : "✗"} "${keyword}"`,
          found ? "green" : "red"
        );
      });
    }

    return { success: true, duration, result };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  logSection("🏦 FINANCIAL GOVERNANCE ENGINE - LIVE SMOKE TESTS");

  log("Testing Linkup API Integration", "cyan");
  log(`API Key: ${LINKUP_API_KEY.substring(0, 20)}...`, "blue");
  log(`Total scenarios: ${TEST_SCENARIOS.length}`, "reset");

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: Date.now(),
    details: [],
  };

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];

    results.total++;
    const testResult = await runTest(scenario);

    if (testResult.success) {
      results.passed++;
    } else {
      results.failed++;
    }

    results.details.push({
      scenario: scenario.name,
      ...testResult,
    });

    // Rate limiting - wait 3 seconds between tests
    if (i < TEST_SCENARIOS.length - 1) {
      log(`\nWaiting 3 seconds (rate limiting)...`, "yellow");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Summary
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);

  logSection("📊 TEST SUMMARY");

  log(`Total Tests: ${results.total}`, "cyan");
  log(`Passed: ${results.passed}`, "green");
  log(`Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");
  log(`Duration: ${duration}s`, "blue");
  log(
    `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
    results.passed === results.total ? "green" : "yellow"
  );

  if (results.passed === results.total) {
    log("\n🎉 ALL TESTS PASSED!", "green");
  } else {
    log(
      `\n⚠️  ${results.failed} test(s) failed. Check logs above for details.`,
      "yellow"
    );
  }

  // Save results to file
  const fs = await import("fs");
  const resultsFile = `test-results-${Date.now()}.json`;
  fs.writeFileSync(
    resultsFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total,
          passed: results.passed,
          failed: results.failed,
          duration: duration,
        },
        details: results.details,
      },
      null,
      2
    )
  );

  log(`\n📄 Results saved to: ${resultsFile}`, "cyan");

  return results;
}

// Run tests
runAllTests()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    log(`\n✗ Fatal error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });

