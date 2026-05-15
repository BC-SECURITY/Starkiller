// e2e/helpers/api/credentials.js
import { jsonResponse, paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/credentials*";

export function mockCredentialsList(page, creds) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() === "POST" &&
      url.pathname.endsWith("/credentials")
    ) {
      return route.fallback(); // recordCredentialActions handles POST
    }
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/credentials\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(creds));
  });
}

export function mockCredentialDetail(page, cred) {
  return page.route(`**/api/v2/credentials/${cred.id}`, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(cred));
  });
}

export function recordCredentialActions(page) {
  const calls = [];
  page.route(LIST, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ method: "POST", body });
      return route.fulfill(jsonResponse({ id: 99, ...body }, 201));
    }
    return route.fallback();
  });
  // PUT updates go to /credentials/{id} — separate route so it doesn't
  // collide with mockCredentialDetail's GET.
  page.route("**/api/v2/credentials/*", async (route) => {
    if (route.request().method() === "PUT") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({
        method: "PUT",
        url: route.request().url(),
        body,
      });
      return route.fulfill(jsonResponse({ ok: true }));
    }
    return route.fallback();
  });
  return { calls };
}
