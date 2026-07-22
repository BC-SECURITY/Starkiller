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

export function mockBypassDetail(page, bypass) {
  return page.route(`**/api/v2/bypasses/${bypass.id}`, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(bypass));
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
  // DELETE /bypasses/{id} — separate route (mirrors listener/credential
  // detail routes) since a bare trailing `*` on LIST doesn't match a
  // sub-path segment.
  page.route("**/api/v2/bypasses/*", async (route) => {
    if (route.request().method() === "DELETE") {
      calls.push({ method: "DELETE", url: route.request().url() });
      return route.fulfill(jsonResponse({}, 204));
    }
    return route.fallback();
  });
  return { calls };
}
