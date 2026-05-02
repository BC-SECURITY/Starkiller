// e2e/helpers/api/malleable.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/malleable-profiles*";
const DETAIL = (id) => `**/api/v2/malleable-profiles/${id}`;

export function mockMalleableProfilesList(page, profiles) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Don't intercept single-profile GET — handled by mockMalleableProfileDetail.
    if (url.pathname.match(/\/malleable-profiles\/[^/]+/)) {
      return route.fallback();
    }
    return route.fulfill(paginatedResponse(profiles));
  });
}

export function mockMalleableProfileDetail(page, profile) {
  return page.route(DETAIL(profile.id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(profile));
  });
}

// Records POST/PUT/DELETE against /malleable-profiles[/{id}].
export function recordMalleableProfileActions(page) {
  const calls = [];
  page.route(LIST, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ method: "POST", body });
      return route.fulfill(jsonResponse({ id: 99, ...body }, 201));
    }
    return route.fallback();
  });
  page.route("**/api/v2/malleable-profiles/*", async (route) => {
    const method = route.request().method();
    if (method === "PUT") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ method, url: route.request().url(), body });
      return route.fulfill(jsonResponse({ ok: true }));
    }
    if (method === "DELETE") {
      calls.push({ method, url: route.request().url() });
      return route.fulfill(jsonResponse({ ok: true }));
    }
    return route.fallback();
  });
  return { calls };
}
