// e2e/helpers/network.js
//
// blockSockets: aborts every Socket.IO request so the WebSocket-using
// notification system doesn't spam the console or leak retry timers
// into tests. Always call before page.goto.
//
// mockEmpireBootstrap: registers handlers for /api/v2/users/me and
// /api/v2/meta/version. These endpoints are called from the login() and
// refreshMe() actions in src/stores/application-module.js — not at boot
// when state is rehydrated from localStorage. For setFakeAuth-authenticated
// specs they should never fire; the mocks exist as a safety net so any
// accidental call returns a benign 200 instead of 404. login.spec.js needs
// real responses here for the happy path.
//
// blockUnmockedApi: registers a deny-all fallback for /api/v2/** that
// fulfills with HTTP 599 if reached. Because Playwright applies routes in
// LIFO order, call this FIRST in beforeEach so per-resource mocks added
// afterward take precedence. Any unmocked call then returns 599: fetch()
// resolves (not rejects), res.ok is false, and the http.js wrapper throws
// Error: HTTP 599, surfaced via the consoleGuard fixture — making silent
// fall-through-to-network bugs immediately obvious. A true network failure
// (fetch itself rejects, e.g. route.abort()) bumps connectionError instead.
// Do NOT add this to specs that intentionally let some routes pass through
// (navigation.spec.js stubs many endpoints inline; add it there once all
// stubs are in place).
//
// mockGeneralFormBackground: stubs the background fetches that
// GeneralForm.vue fires on every mount — agents, listeners, bypasses,
// malleable-profiles, and credentials. Any spec whose view renders a
// <general-form> must call this before page.goto so these requests don't
// fall through to the blockUnmockedApi sentinel.
//
// mockTagsEndpoint: stubs GET /tags* with an empty list. Used by many list
// views (AgentsList, ListenersList, CredentialsList, Downloads). Extracted
// to avoid repeating the same 4-line block across specs.
//
// mockListenersPage: stubs GET /listeners and GET /tags?sources=listener,
// both of which are fetched whenever the app redirects to the listeners
// list (App.vue redirects there on login and after some actions).

import { jsonResponse, paginatedResponse } from "./responses.js";

export function blockSockets(page) {
  return page.route("**/socket.io/**", (route) => route.abort());
}

export async function mockEmpireBootstrap(page, { admin = false } = {}) {
  await page.route("**/api/v2/users/me", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(
      jsonResponse({ id: 1, username: "test", is_admin: admin }),
    );
  });
  await page.route("**/api/v2/meta/version", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse({ version: "0.0.0-test" }));
  });
}

export function blockUnmockedApi(page) {
  // eslint-disable-next-line no-console
  return page.route("**/api/v2/**", (route) => {
    const req = route.request();
    // eslint-disable-next-line no-console
    console.error(`[e2e] Unmocked API call: ${req.method()} ${req.url()}`);
    return route.fulfill({
      status: 599,
      contentType: "application/json",
      body: JSON.stringify({ error: `Unmocked: ${req.method()} ${req.url()}` }),
    });
  });
}

// Stubs the background fetches that GeneralForm.vue fires on every mount:
// agents (include_archived=true), listeners, bypasses, malleable-profiles,
// and credentials. Must be called before page.goto in any spec whose view
// renders <general-form> (credential-create, bypass-create, stager-create,
// listener-create, module-execute, agent-detail).
export async function mockGeneralFormBackground(page) {
  await page.route("**/api/v2/agents*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Only intercept the list endpoint (no sub-paths like /agents/ID or /agents/ID/tasks).
    if (url.pathname.match(/\/agents\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route("**/api/v2/listeners*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/listeners\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route("**/api/v2/bypasses*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/bypasses\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route("**/api/v2/malleable-profiles*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route("**/api/v2/credentials*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/credentials\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

// Tags endpoint fires from many list views (AgentsList, ListenersList, etc).
// Always returns an empty list — specs don't currently test tags.
export function mockTagsEndpoint(page) {
  return page.route("**/api/v2/tags*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

// Stubs GET /listeners and GET /tags?sources=listener.
// Called by specs where the app may redirect to the listeners page
// (App.vue redirects there on successful login and on isLoggedIn transitions).
export async function mockListenersPage(page) {
  await page.route("**/api/v2/listeners*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/listeners\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route("**/api/v2/tags*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}
