// e2e/helpers/api/modules.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/modules*";
const DETAIL = (id) => `**/api/v2/modules/${id}`;

export function mockModulesList(page, modules) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/modules\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(modules));
  });
}

export function mockModuleDetail(page, mod) {
  return page.route(DETAIL(mod.id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(mod));
  });
}

export function recordModuleExecutions(page) {
  const calls = [];
  // The API posts to /agents/{sessionId}/tasks/module/ (trailing slash) —
  // verified in src/api/module-api.js executeModule(). The glob uses '/**'
  // so that Playwright's '**' crosses the slash boundary, matching both
  // the trailing-slash form (.../module/) and any future sub-path.
  page.route("**/api/v2/agents/*/tasks/module/**", async (route) => {
    if (route.request().method() === "POST") {
      calls.push({
        url: route.request().url(),
        body: JSON.parse(route.request().postData() || "{}"),
      });
      return route.fulfill(jsonResponse({ id: 1, status: "queued" }, 201));
    }
    return route.fallback();
  });
  return { calls };
}
