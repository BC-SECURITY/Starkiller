// e2e/fixtures/test.js
//
// Project test fixture. Extends Playwright's base test with:
// - blockUnmockedApi (auto): registers a deny-all /api/v2/** fallback
//   that returns HTTP 599 for any unmocked call. Because Playwright applies
//   routes in LIFO order, this fixture runs before each test's beforeEach,
//   so per-spec page.route() calls added in beforeEach take precedence.
// - consoleGuard (auto): fails the test if the page raises an uncaught JS
//   exception or logs a non-allowlisted console.error.
//
// Use throughout the suite via `import { test, expect } from "./fixtures/test.js"`.

import { test as base, expect } from "@playwright/test";
import { blockUnmockedApi } from "../helpers/network.js";

const CONSOLE_ERROR_ALLOWLIST = [
  // vue-router emits this when a beforeEach guard returns next(false)
  // (used by the admin-only route guard for non-admin redirects).
  /Navigation aborted/,
  // Vue dev mode warnings (not errors). console.warn is already filtered;
  // this catches edge cases where Vue uses console.error for warnings.
  /^\[Vue warn\]/,
  // http.js handleError() logs every API error via console.error.
  // Thrown errors are plain Error objects with message "HTTP <status>", so the
  // browser surfaces them as "Error: HTTP <status>" — the "Error:" prefix is
  // what matches here. This fires on expected error paths (login 401,
  // blockUnmockedApi 599, etc.). Allowlisted so the guard catches
  // Vue/Vuetify/uncaught issues instead. No code produces "AxiosError" anymore.
  /^Error:/,
  // Chromium emits a browser-level "Failed to load resource" console error for
  // non-2xx responses before JavaScript processes them. This fires in
  // login.spec.js's "failed login" test (POST /token → 401 Unauthorized).
  // Narrowed to the /token path so other URLs are not silently swallowed.
  /^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/,
  // Same as above, for forced-logout.spec.js's 403 regression test (the
  // http.js interceptor's 403 branch).
  /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)/,
  // Same as above, for specs that intentionally mock a 500 to test
  // error-surfacing UI behavior (e.g. bypasses.spec.js / credentials-edit.spec.js
  // delete-failure regression tests, and agent-detail.spec.js's kill/clear-queue
  // failure-path regression tests).
  /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)/,
  // Chromium emits this when a request is aborted (route.abort()). Fires in
  // login.spec.js's "network failure" test (POST /token → aborted).
  /^Failed to load resource: net::ERR_FAILED/,
  // Dashboard.refreshAll() logs each failed refresh leg via console.error
  // ("[Dashboard] agents refresh failed: ..."). Intentional error path,
  // exercised by dashboard.spec.js's error-isolation test. Anchored to the
  // [Dashboard] prefix so unrelated errors still fail tests.
  /^\[Dashboard\]/,
  // Chromium logs a browser-level resource error for any non-2xx XHR.
  // dashboard.spec.js's error-isolation test intentionally serves the agents
  // list with HTTP 500. Same precedent as the 401 entry above.
  /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)/,
  // The agent store intentionally logs fetch failures before swallowing them
  // (status="error"); dashboard.spec.js's error-isolation test triggers this
  // with its 500. Narrowly anchored to the fetch-agents message so OTHER
  // [Starkiller]-prefixed errors (e.g. component update crashes) still fail.
  /^\[Starkiller\] Failed to fetch agents/,
];

export const test = base.extend({
  // Registered first (before beforeEach) so spec-level page.route() calls
  // added in beforeEach take precedence via Playwright's LIFO route ordering.
  blockUnmockedApi: [
    async ({ page }, use) => {
      await blockUnmockedApi(page);
      await use();
    },
    { auto: true },
  ],

  consoleGuard: [
    async ({ page }, use) => {
      const errors = [];
      page.on("pageerror", (err) => {
        errors.push(`pageerror: ${err.message}`);
      });
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (CONSOLE_ERROR_ALLOWLIST.some((re) => re.test(text))) return;
        errors.push(`console.error: ${text}`);
      });
      await use(errors);
      // Assert at end of test. If errors fired, the test fails with the list.
      if (errors.length > 0) {
        throw new Error(
          `Page emitted ${errors.length} console error(s) / uncaught exception(s):\n` +
            errors.join("\n"),
        );
      }
    },
    { auto: true },
  ],
});

export { expect };
