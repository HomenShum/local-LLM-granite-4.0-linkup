/**
 * Standalone Smoke Test for Tool Calling
 * Tests Linkup API integration directly without the full UI
 */

import { webSearch, fetchUrlContent } from "../src/utils/linkupApi.js";
import { FINANCIAL_GOVERNANCE_SCENARIOS } from "./financial-governance-scenarios.js";

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

async function testWebSearch() {
  logSection("TEST 1: Web Search - Basel III Capital Requirements");

  try {
    log("Searching for Basel III capital requirements...", "blue");

    const result = await webSearch(
      "Basel III minimum capital requirements Tier 1 CET1 2024",
      {
        depth: "standard",
        includeDomains: ["bis.org", "federalreserve.gov"],
      }
    );

    log("✓ Search completed successfully", "green");
    log(`Answer: ${result.answer.substring(0, 200)}...`, "reset");

    if (result.sources && result.sources.length > 0) {
      log(`\nSources found: ${result.sources.length}`, "green");
      result.sources.slice(0, 3).forEach((source, i) => {
        log(`  ${i + 1}. ${source.name}`, "reset");
        log(`     ${source.url}`, "blue");
      });
    }

    // Validation
    const answerLower = result.answer.toLowerCase();
    const validations = [
      { check: answerLower.includes("tier"), label: "Mentions 'tier'" },
      { check: answerLower.includes("capital"), label: "Mentions 'capital'" },
      { check: result.sources.length > 0, label: "Has sources" },
    ];

    log("\nValidations:", "yellow");
    validations.forEach((v) => {
      log(
        `  ${v.check ? "✓" : "✗"} ${v.label}`,
        v.check ? "green" : "red"
      );
    });

    return validations.every((v) => v.check);
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

async function testFetchUrl() {
  logSection("TEST 2: URL Fetch - BIS Website");

  try {
    log("Fetching content from BIS website...", "blue");

    const result = await fetchUrlContent("https://www.bis.org/", {
      renderJs: false,
      extractImages: false,
    });

    log("✓ Fetch completed successfully", "green");
    log(
      `Content length: ${result.markdown ? result.markdown.length : 0} characters`,
      "reset"
    );
    log(
      `Preview: ${result.markdown ? result.markdown.substring(0, 150) : "No content"}...`,
      "reset"
    );

    // Validation
    const validations = [
      {
        check: result.markdown && result.markdown.length > 100,
        label: "Has substantial content",
      },
      {
        check:
          result.markdown &&
          result.markdown.toLowerCase().includes("bank"),
        label: "Contains banking-related content",
      },
    ];

    log("\nValidations:", "yellow");
    validations.forEach((v) => {
      log(
        `  ${v.check ? "✓" : "✗"} ${v.label}`,
        v.check ? "green" : "red"
      );
    });

    return validations.every((v) => v.check);
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

async function testScenario(scenario) {
  logSection(`TEST: ${scenario.name}`);

  try {
    log(`Description: ${scenario.description}`, "reset");
    log(`Query: ${scenario.query}`, "blue");

    const startTime = Date.now();

    // Determine which tool to use based on scenario
    let result;
    if (scenario.expectedTools.includes("web_search")) {
      log("\nExecuting web_search...", "blue");
      result = await webSearch(scenario.query, {
        depth: "standard",
        includeDomains: scenario.expectedDomains || [],
      });
    } else if (scenario.expectedTools.includes("fetch_url_content")) {
      log("\nExecuting fetch_url_content...", "blue");
      // Extract URL from query if present
      const urlMatch = scenario.query.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        result = await fetchUrlContent(urlMatch[0]);
      } else {
        throw new Error("No URL found in query");
      }
    }

    const duration = Date.now() - startTime;

    log(`✓ Completed in ${duration}ms`, "green");

    // Display result summary
    if (result.answer) {
      log(`\nAnswer: ${result.answer.substring(0, 300)}...`, "reset");
    }
    if (result.sources) {
      log(`\nSources: ${result.sources.length}`, "green");
    }
    if (result.markdown) {
      log(
        `\nContent length: ${result.markdown.length} characters`,
        "green"
      );
    }

    // Validate against criteria
    if (scenario.validationCriteria) {
      log("\nValidation Criteria:", "yellow");
      const responseText = (result.answer || result.markdown || "").toLowerCase();

      scenario.validationCriteria.forEach((criteria) => {
        const keywords = criteria.toLowerCase().match(/\b\w+\b/g) || [];
        const matchCount = keywords.filter((kw) =>
          responseText.includes(kw)
        ).length;
        const passed = matchCount >= keywords.length * 0.3; // 30% keyword match

        log(
          `  ${passed ? "✓" : "⚠"} ${criteria}`,
          passed ? "green" : "yellow"
        );
      });
    }

    return true;
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

async function runAllTests() {
  logSection("🏦 FINANCIAL GOVERNANCE ENGINE - SMOKE TESTS");

  log("Testing Linkup API Integration with Tool Calling", "cyan");
  log(`Total scenarios: ${FINANCIAL_GOVERNANCE_SCENARIOS.length}`, "reset");

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: Date.now(),
  };

  // Run basic API tests
  log("\n📋 Running Basic API Tests...\n", "cyan");

  results.total++;
  if (await testWebSearch()) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limiting

  results.total++;
  if (await testFetchUrl()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Run scenario tests (first 5 to avoid rate limits)
  log("\n📋 Running Scenario Tests (First 5)...\n", "cyan");

  for (let i = 0; i < Math.min(5, FINANCIAL_GOVERNANCE_SCENARIOS.length); i++) {
    const scenario = FINANCIAL_GOVERNANCE_SCENARIOS[i];

    results.total++;
    if (await testScenario(scenario)) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Rate limiting - wait 3 seconds between tests
    if (i < 4) {
      log("\nWaiting 3 seconds (rate limiting)...", "yellow");
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

  return results;
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      log(`\n✗ Fatal error: ${error.message}`, "red");
      console.error(error);
      process.exit(1);
    });
}

export { runAllTests, testWebSearch, testFetchUrl, testScenario };

