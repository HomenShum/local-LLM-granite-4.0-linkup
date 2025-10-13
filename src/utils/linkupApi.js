/**
 * Linkup API Integration Module
 * Provides web search and URL fetch capabilities using Linkup API
 */

// Load API key from environment variable (set in .env file)
const LINKUP_API_KEY = import.meta.env.VITE_LINKUP_API_KEY;
const LINKUP_BASE_URL = "https://api.linkup.so/v1";

// Validate API key is configured
if (!LINKUP_API_KEY || LINKUP_API_KEY === "your_linkup_api_key_here") {
  console.error(
    "⚠️  LINKUP_API_KEY not configured. Please set VITE_LINKUP_API_KEY in your .env file."
  );
}

/**
 * Performs a web search using Linkup API
 * @param {string} query - The search query
 * @param {Object} options - Additional search options
 * @returns {Promise<Object>} Search results with answer and sources
 */
export async function webSearch(query, options = {}) {
  const {
    depth = "standard",
    outputType = "sourcedAnswer",
    includeImages = false,
    fromDate = null,
    toDate = null,
    excludeDomains = [],
    includeDomains = [],
  } = options;

  try {
    const requestBody = {
      q: query,
      depth,
      outputType,
      includeImages,
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(excludeDomains.length > 0 && { excludeDomains }),
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
      throw new Error(
        `Linkup API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Web search error:", error);
    throw new Error(`Failed to perform web search: ${error.message}`);
  }
}

/**
 * Fetches content from a URL using Linkup API
 * @param {string} url - The URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Fetched content in markdown format
 */
export async function fetchUrlContent(url, options = {}) {
  const {
    includeRawHtml = false,
    renderJs = false,
    extractImages = false,
  } = options;

  try {
    const requestBody = {
      url,
      includeRawHtml,
      renderJs,
      extractImages,
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
      throw new Error(
        `Linkup API error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("URL fetch error:", error);
    throw new Error(`Failed to fetch URL content: ${error.message}`);
  }
}

/**
 * Formats search results for display
 * @param {Object} searchResult - Raw search result from Linkup
 * @returns {string} Formatted result string
 */
export function formatSearchResult(searchResult) {
  if (!searchResult) return "No results found.";

  let formatted = `${searchResult.answer}\n\n`;

  if (searchResult.sources && searchResult.sources.length > 0) {
    formatted += "Sources:\n";
    searchResult.sources.forEach((source, index) => {
      formatted += `${index + 1}. ${source.name}\n   ${source.url}\n`;
      if (source.snippet) {
        formatted += `   ${source.snippet.substring(0, 150)}...\n`;
      }
      formatted += "\n";
    });
  }

  return formatted;
}

/**
 * Formats fetched URL content for display
 * @param {Object} fetchResult - Raw fetch result from Linkup
 * @returns {string} Formatted content string
 */
export function formatFetchResult(fetchResult) {
  if (!fetchResult || !fetchResult.markdown) {
    return "No content found.";
  }

  let formatted = fetchResult.markdown;

  if (fetchResult.images && fetchResult.images.length > 0) {
    formatted += "\n\nImages found:\n";
    fetchResult.images.forEach((image, index) => {
      formatted += `${index + 1}. ${image.alt || "Image"}: ${image.url}\n`;
    });
  }

  return formatted;
}

