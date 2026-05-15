// e2e/login.spec.js
//
// The only spec that exercises the real login form (via loginViaForm).
// Every other spec uses setFakeAuth to skip the form.

import { test, expect } from "./fixtures/test.js";
import { loginViaForm } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockListenersPage,
} from "./helpers/network.js";
import { jsonResponse } from "./helpers/responses.js";

test.describe("login form", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await mockEmpireBootstrap(page); // /users/me, /meta/version
    // After successful login App.vue redirects to the listeners page which
    // calls getListeners() and getTags(sources=listener) on mount.
    await mockListenersPage(page);
  });

  test("successful login redirects away from home", async ({ page }) => {
    await page.route("**/token", (route) =>
      route.fulfill(jsonResponse({ access_token: "fake-jwt" })),
    );

    await loginViaForm(page, {
      url: "http://localhost:1337",
      username: "empireadmin",
      password: "password123",
    });

    // Login.vue.submit() doesn't navigate explicitly; the app reacts to
    // isLoggedIn becoming true. Wait for any change away from "/" or
    // for some authenticated UI marker.
    await expect(page).not.toHaveURL(/#\/$/, { timeout: 10_000 });
  });

  test("failed login shows error", async ({ page }) => {
    await page.route("**/token", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Incorrect username or password" }),
      }),
    );

    await loginViaForm(page, {
      url: "http://localhost:1337",
      username: "wrong",
      password: "wrong",
    });

    // Login.vue surfaces loginError via this.snack.error(...). The toast
    // text contains the detail. Match loosely.
    await expect(
      page.getByText(/incorrect username or password/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/#\/$/);
  });
});
