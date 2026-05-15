// e2e/helpers/api/stagers.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/stagers*";
// Templates live at /stager-templates (not /stagers/templates).
// Confirmed from src/api/stager-api.js getStagerTemplate and getStagerTemplates.
const TEMPLATES_LIST = "**/api/v2/stager-templates*";
const TEMPLATE_DETAIL = (id) => `**/api/v2/stager-templates/${id}`;

export function mockStagersList(page, stagers) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/stagers\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(stagers));
  });
}

export function mockStagerTemplates(page, templates) {
  return page.route(TEMPLATES_LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/stager-templates\/[^/]+/)) {
      return route.fallback();
    }
    return route.fulfill(paginatedResponse(templates));
  });
}

export function mockStagerTemplate(page, template) {
  return page.route(TEMPLATE_DETAIL(template.id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(template));
  });
}

export function recordStagerCreate(page) {
  const calls = [];
  page.route("**/api/v2/stagers", async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      // createStager in the view reads .then(({ id }) => ...) so return { id }
      const created = { id: 99, ...body };
      calls.push({ body });
      return route.fulfill(jsonResponse(created, 201));
    }
    return route.fallback();
  });
  return { calls };
}
