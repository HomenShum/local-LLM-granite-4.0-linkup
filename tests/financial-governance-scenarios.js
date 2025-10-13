/**
 * Financial Governance Engine - Test Scenarios
 * 10 comprehensive test scenarios for tool calling with web search
 * Based on task_instructions.md and job_description.md requirements
 */

export const FINANCIAL_GOVERNANCE_SCENARIOS = [
  {
    id: 1,
    name: "Current Basel III Capital Requirements",
    description:
      "Search for current Basel III capital adequacy requirements and calculate minimum capital ratios for a financial institution",
    query:
      "What are the current Basel III minimum capital requirements for Tier 1 capital ratio and total capital ratio for banks in 2024? Include Common Equity Tier 1 (CET1) requirements.",
    expectedTools: ["web_search"],
    expectedDomains: ["bis.org", "federalreserve.gov"],
    validationCriteria: [
      "Should mention CET1 ratio of 4.5%",
      "Should mention Tier 1 capital ratio of 6%",
      "Should mention total capital ratio of 8%",
      "Should reference Basel Committee on Banking Supervision",
    ],
  },

  {
    id: 2,
    name: "SEC Reporting Requirements for Public Companies",
    description:
      "Fetch current SEC filing requirements and deadlines for quarterly and annual reports",
    query:
      "What are the SEC filing deadlines for Form 10-K and Form 10-Q for large accelerated filers in 2024? Search for the most recent SEC guidance.",
    expectedTools: ["web_search"],
    expectedDomains: ["sec.gov"],
    validationCriteria: [
      "Should mention 10-K deadline (60 days after fiscal year end)",
      "Should mention 10-Q deadline (40 days after quarter end)",
      "Should reference large accelerated filer criteria",
    ],
  },

  {
    id: 3,
    name: "Credit Risk Weighted Assets Calculation",
    description:
      "Search for standardized approach to calculating risk-weighted assets for different asset classes",
    query:
      "Under Basel III standardized approach, what are the risk weights for corporate exposures, residential mortgages, and sovereign debt? Search for the latest regulatory guidance.",
    expectedTools: ["web_search"],
    expectedDomains: ["bis.org", "occ.gov"],
    validationCriteria: [
      "Should mention risk weights for different asset classes",
      "Should reference standardized approach",
      "Should include information about credit ratings impact",
    ],
  },

  {
    id: 4,
    name: "Dodd-Frank Stress Testing Requirements",
    description:
      "Research current DFAST (Dodd-Frank Act Stress Testing) requirements and scenarios",
    query:
      "What are the current Dodd-Frank stress testing requirements for banks with over $100 billion in assets? Search for 2024 CCAR scenarios and requirements.",
    expectedTools: ["web_search"],
    expectedDomains: ["federalreserve.gov", "federalregister.gov"],
    validationCriteria: [
      "Should mention CCAR (Comprehensive Capital Analysis and Review)",
      "Should reference stress test scenarios",
      "Should mention asset threshold requirements",
    ],
  },

  {
    id: 5,
    name: "ESG Disclosure Requirements",
    description:
      "Search for current ESG (Environmental, Social, Governance) disclosure requirements for financial institutions",
    query:
      "What are the latest SEC climate disclosure requirements for public companies in 2024? Search for final rules on climate-related disclosures.",
    expectedTools: ["web_search"],
    expectedDomains: ["sec.gov"],
    validationCriteria: [
      "Should mention climate-related disclosures",
      "Should reference SEC proposed or final rules",
      "Should discuss materiality standards",
    ],
  },

  {
    id: 6,
    name: "Liquidity Coverage Ratio (LCR) Requirements",
    description:
      "Research current LCR requirements and high-quality liquid assets (HQLA) definitions",
    query:
      "What is the minimum Liquidity Coverage Ratio (LCR) requirement under Basel III, and what assets qualify as Level 1 HQLA? Search for current regulatory standards.",
    expectedTools: ["web_search"],
    expectedDomains: ["bis.org", "federalreserve.gov"],
    validationCriteria: [
      "Should mention 100% LCR requirement",
      "Should define HQLA categories",
      "Should reference 30-day stress scenario",
    ],
  },

  {
    id: 7,
    name: "Anti-Money Laundering (AML) Compliance",
    description:
      "Search for current AML compliance requirements and FinCEN reporting obligations",
    query:
      "What are the current FinCEN requirements for Suspicious Activity Reports (SARs) and Currency Transaction Reports (CTRs) in 2024? Include filing thresholds and deadlines.",
    expectedTools: ["web_search"],
    expectedDomains: ["fincen.gov", "treasury.gov"],
    validationCriteria: [
      "Should mention $10,000 threshold for CTRs",
      "Should reference SAR filing requirements",
      "Should mention Bank Secrecy Act (BSA)",
    ],
  },

  {
    id: 8,
    name: "Portfolio Diversification Standards",
    description:
      "Research industry best practices for portfolio diversification and concentration limits",
    query:
      "What are the recommended concentration limits and diversification standards for institutional investment portfolios? Search for guidance from CFA Institute and regulatory bodies.",
    expectedTools: ["web_search"],
    expectedDomains: ["cfainstitute.org"],
    validationCriteria: [
      "Should mention concentration risk",
      "Should reference diversification principles",
      "Should discuss sector or asset class limits",
    ],
  },

  {
    id: 9,
    name: "Loan-to-Value (LTV) Ratio Regulations",
    description:
      "Search for current regulatory guidance on maximum LTV ratios for different types of loans",
    query:
      "What are the maximum Loan-to-Value (LTV) ratios for residential mortgages, commercial real estate, and home equity loans under current banking regulations? Search for FDIC and OCC guidance.",
    expectedTools: ["web_search"],
    expectedDomains: ["fdic.gov", "occ.gov"],
    validationCriteria: [
      "Should mention LTV limits for different loan types",
      "Should reference prudent lending standards",
      "Should discuss risk management considerations",
    ],
  },

  {
    id: 10,
    name: "Stress Testing Scenarios - Market Shock",
    description:
      "Research historical market stress scenarios and their impact on financial institutions",
    query:
      "What were the key stress test scenarios used by the Federal Reserve in the 2024 CCAR, including the severely adverse scenario? Search for specific economic assumptions like equity market decline and unemployment rates.",
    expectedTools: ["web_search"],
    expectedDomains: ["federalreserve.gov"],
    validationCriteria: [
      "Should mention severely adverse scenario",
      "Should include specific economic variables",
      "Should reference equity market decline assumptions",
      "Should mention unemployment rate projections",
    ],
  },
];

/**
 * Additional complex multi-tool scenarios
 */
export const MULTI_TOOL_SCENARIOS = [
  {
    id: 11,
    name: "Fetch and Analyze SEC Filing",
    description:
      "First search for a company's latest 10-K filing URL, then fetch and analyze its content",
    query:
      "Find JPMorgan Chase's latest 10-K filing on the SEC website, then fetch the document and summarize their capital adequacy ratios and stress testing results.",
    expectedTools: ["web_search", "fetch_url_content"],
    validationCriteria: [
      "Should first search for the filing",
      "Should then fetch the specific document",
      "Should extract relevant financial metrics",
    ],
  },

  {
    id: 12,
    name: "Regulatory Update Analysis",
    description:
      "Search for recent regulatory updates and fetch detailed guidance documents",
    query:
      "Search for the latest Basel Committee publications on operational risk management, then fetch the most recent consultation paper and summarize the key proposed changes.",
    expectedTools: ["web_search", "fetch_url_content"],
    validationCriteria: [
      "Should identify recent publications",
      "Should fetch specific documents",
      "Should summarize key changes",
    ],
  },
];

/**
 * Validation helper function
 */
export function validateScenarioResult(scenario, result) {
  const validations = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    passed: true,
    failures: [],
    warnings: [],
  };

  // Check if expected tools were called
  if (scenario.expectedTools) {
    scenario.expectedTools.forEach((tool) => {
      if (!result.toolsCalled || !result.toolsCalled.includes(tool)) {
        validations.passed = false;
        validations.failures.push(`Expected tool '${tool}' was not called`);
      }
    });
  }

  // Check validation criteria
  if (scenario.validationCriteria && result.finalResponse) {
    scenario.validationCriteria.forEach((criteria) => {
      const criteriaLower = criteria.toLowerCase();
      const responseLower = result.finalResponse.toLowerCase();

      // Simple keyword matching - could be enhanced with more sophisticated NLP
      const keywords = criteriaLower.match(/\b\w+\b/g) || [];
      const matchedKeywords = keywords.filter((kw) =>
        responseLower.includes(kw)
      );

      if (matchedKeywords.length < keywords.length * 0.5) {
        validations.warnings.push(
          `Validation criteria may not be met: "${criteria}"`
        );
      }
    });
  }

  return validations;
}

