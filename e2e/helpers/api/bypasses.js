// e2e/helpers/api/bypasses.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/bypasses*";

export function mockBypassesList(page, bypasses) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() === "POST" &&
      url.pathname.endsWith("/bypasses")
    ) {
      return route.fallback();
    }
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/bypasses\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(bypasses));
  });
}

export function recordBypassActions(page) {
  const calls = [];
  page.route(LIST, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ body });
      return route.fulfill(jsonResponse({ id: 99, ...body }, 201));
    }
    return route.fallback();
  });
  return { calls };
}
