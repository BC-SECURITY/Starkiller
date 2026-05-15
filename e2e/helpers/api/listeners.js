// e2e/helpers/api/listeners.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/listeners*";
// Templates live at /listener-templates (not /listeners/templates).
const TEMPLATES_LIST = "**/api/v2/listener-templates*";
const TEMPLATE_DETAIL = (id) => `**/api/v2/listener-templates/${id}`;

export function mockListenersList(page, listeners) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Don't intercept /listeners/{id} here.
    if (url.pathname.match(/\/listeners\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(listeners));
  });
}

export function mockListenerTemplates(page, templates) {
  return page.route(TEMPLATES_LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Don't intercept single-template GET (handled by mockListenerTemplate).
    if (url.pathname.match(/\/listener-templates\/[^/]+/)) {
      return route.fallback();
    }
    return route.fulfill(paginatedResponse(templates));
  });
}

export function mockListenerTemplate(page, template) {
  return page.route(TEMPLATE_DETAIL(template.id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(template));
  });
}

// Records URL + method + body for every mutating request to /listeners/*.
// The kill action uses DELETE /listeners/{id} (no body).
export function recordListenerActions(page) {
  const calls = [];
  page.route("**/api/v2/listeners/*", async (route) => {
    const m = route.request().method();
    if (m === "PUT" || m === "POST" || m === "DELETE") {
      calls.push({
        url: route.request().url(),
        method: m,
        body: JSON.parse(route.request().postData() || "{}"),
      });
      return route.fulfill(
        jsonResponse({ ok: true }, m === "POST" ? 201 : 200),
      );
    }
    return route.fallback();
  });
  return { calls };
}
