// e2e/helpers/api/obfuscation.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const GLOBAL_LIST = "**/api/v2/obfuscation/global*";
const KEYWORDS = "**/api/v2/obfuscation/keywords*";

export function mockObfuscationGlobal(page, configs) {
  return page.route(GLOBAL_LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Don't intercept /obfuscation/global/<language>.
    if (url.pathname.match(/\/global\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(configs));
  });
}

// Obfuscation.vue calls obfuscationStore.getKeywords() on mount in addition
// to getConfigs(). Both must be mocked so the page renders without unmocked calls.
export function mockObfuscationKeywords(page) {
  return page.route(KEYWORDS, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

export function recordObfuscationUpdates(page) {
  const calls = [];
  page.route("**/api/v2/obfuscation/global/*", async (route) => {
    if (route.request().method() === "PUT") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ url: route.request().url(), body });
      return route.fulfill(jsonResponse({ ok: true }));
    }
    return route.fallback();
  });
  return { calls };
}
