// e2e/forced-logout.spec.js
//
// Regression test for the 401/403 interceptor in http.js, which used to
// call the same logout() as the voluntary "Log Out" button with zero
// explanation -- an operator whose token expired mid-session (e.g. a
// background poll's 401) was silently teleported to the login screen,
// indistinguishable from choosing to sign out.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";

test.describe("forced logout messaging", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // AgentsList.vue's mounted() also fires getTags() -- unrelated to the
    // 401/403 under test, but left unmocked it 599s and trips consoleGuard.
    await mockTagsEndpoint(page);
  });

  test("a 401 mid-session redirects to login with a session-expired message", async ({
    page,
  }) => {
    await page.route("**/api/v2/agents*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Token expired" }),
      });
    });

    await page.goto("/#/agents");

    await expect(page).toHaveURL(/#\/$/);
    // Dismiss the "recommended Empire version" compat banner -- it's queued
    // through the same snackbar as our error toast and would otherwise
    // delay it past the assertion timeout below.
    await page.locator("button:has(.fa-times)").click();
    await expect(page.getByText(/your session has expired/i)).toBeVisible();
  });

  test("a 403 mid-session redirects to login with a permission-denied message", async ({
    page,
  }) => {
    await page.route("**/api/v2/agents*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Forbidden" }),
      });
    });

    await page.goto("/#/agents");

    await expect(page).toHaveURL(/#\/$/);
    await page.locator("button:has(.fa-times)").click();
    await expect(page.getByText(/no longer have permission/i)).toBeVisible();
  });

  // Regression test: the voluntary "Log Out" button (Settings.vue) calls
  // logout() with no reason -- it must not show a stale forced-logout
  // message left over from some earlier session state.
  test("the voluntary Log Out button shows no forced-logout message", async ({
    page,
  }) => {
    await page.goto("/#/settings");
    await page.getByRole("button", { name: "Logout" }).click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByText(/session has expired/i)).not.toBeVisible();
    await expect(
      page.getByText(/no longer have permission/i),
    ).not.toBeVisible();
  });
});
