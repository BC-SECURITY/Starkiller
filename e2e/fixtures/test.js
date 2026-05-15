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
  // axios-instance.js handleError() logs every API error via console.error.
  // This fires on expected error paths (login 401, blockUnmockedApi 599, etc.).
  // Allowlisted here so the guard catches Vue/Vuetify/uncaught issues instead.
  // Anchored alternation: ^(A|B) anchors both alternatives; /^A|B/ would only
  // anchor A, letting B match anywhere in the string.
  /^(Error:|AxiosError)/,
  // Chromium emits a browser-level "Failed to load resource" console error for
  // non-2xx responses before JavaScript processes them. This fires in
  // login.spec.js's "failed login" test (POST /token → 401 Unauthorized).
  // Narrowed to the /token path so other URLs are not silently swallowed.
  /^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/,
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
