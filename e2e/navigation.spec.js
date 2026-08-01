// e2e/navigation.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { paginatedResponse } from "./helpers/responses.js";

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Stub the most common list endpoints so navigating doesn't 404.
    // Each is empty — specific assertions live in feature specs.
    // Tags is also stubbed here because list pages (agents, listeners,
    // credentials, downloads) call getTags() on mount.
    for (const path of [
      "**/api/v2/agents*",
      "**/api/v2/listeners*",
      "**/api/v2/modules*",
      "**/api/v2/users*",
      "**/api/v2/credentials*",
      "**/api/v2/stagers*",
      "**/api/v2/bypasses*",
      "**/api/v2/downloads*",
      "**/api/v2/plugins*",
      "**/api/v2/obfuscation/global*",
      "**/api/v2/tags*",
    ]) {
      await page.route(path, (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        return route.fulfill(paginatedResponse([]));
      });
    }
  });

  test("authenticated user lands on a non-home route", async ({ page }) => {
    await page.goto("/#/agents");
    // If setFakeAuth is broken, the route guard redirects to /#/ and
    // this URL assertion fails first.
    await expect(page).toHaveURL(/#\/agents$/);
  });

  test("unauthenticated user is redirected to home", async ({
    page,
    context,
  }) => {
    // Override: clear the fake-auth init script effect by clearing storage
    // before goto.
    await context.clearCookies();
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/#/agents");
    await expect(page).toHaveURL(/#\/$/);
  });

  test("sidebar navigates to listeners", async ({ page }) => {
    await page.goto("/#/agents");
    // The sidebar starts in mini/rail mode (icon-only). Expand it first
    // by clicking the expand toggle button (mdi-page-last icon).
    await page
      .locator(".v-navigation-drawer")
      .getByRole("button")
      .first()
      .click();
    // After expanding, the "Listeners" group label is visible. Click it
    // to open the group, then click the "Listeners" sub-item link.
    await page
      .locator(".v-list-group")
      .filter({ hasText: "Listeners" })
      .first()
      .click();
    // The Listeners sub-item renders as <a href="#/listeners">
    await page.locator('[href="#/listeners"]').first().click();
    await expect(page).toHaveURL(/#\/listeners$/);
  });
});
