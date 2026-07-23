// e2e/login.spec.js
//
// The only spec that exercises the real login form (via loginViaForm).
// Every other spec uses setFakeAuth to skip the form.

import { test, expect } from "./fixtures/test.js";
import { loginViaForm, setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { jsonResponse } from "./helpers/responses.js";
import {
  mockAgentsList,
  mockDashboardOnlyEndpoints,
} from "./helpers/api/agents.js";
import {
  mockListenersList,
  mockListenerTemplates,
} from "./helpers/api/listeners.js";
import { mockCredentialsList } from "./helpers/api/credentials.js";
import { defaultAgents } from "./fixtures/agents.js";
import { defaultListeners, httpTemplate } from "./fixtures/listeners.js";

test.describe("login form", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await mockEmpireBootstrap(page); // /users/me, /meta/version
    // After a successful login App.vue redirects to the Dashboard, which
    // fetches agents, listeners, listener-templates, credentials, recent
    // tasks, and check-in aggregates on mount. Stub them so the console-error
    // guard doesn't trip on unmocked calls. (mockTagsEndpoint is defensive:
    // the Dashboard itself doesn't fetch tags — the list views that share these
    // mocks on other routes do — so stubbing it here is harmless and future-
    // proofs the shared beforeEach.)
    await mockTagsEndpoint(page);
    await mockAgentsList(page, defaultAgents);
    await mockListenersList(page, defaultListeners);
    await mockListenerTemplates(page, [httpTemplate]);
    await mockCredentialsList(page, []);
    await mockDashboardOnlyEndpoints(page);
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
    // isLoggedIn becoming true. Assert we land on the dashboard specifically
    // (the redirect target this spec guards) and that it actually mounts,
    // rather than just "left the home route".
    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10_000 });
    // The Dashboard's only <h1> is class="d-sr-only": Vuetify clips it to a 1x1
    // box (position:absolute; clip) but never display:none/visibility:hidden, so
    // Playwright still reports it visible. toBeVisible() therefore confirms the
    // component actually laid out (a stronger check than toBeAttached), not just
    // that the route changed.
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("already-authenticated user landing on the login route is redirected to the dashboard", async ({
    page,
  }) => {
    // App.vue has a second redirect branch, distinct from the isLoggedIn watcher
    // the success test covers: the immediate isLoginPage handler
    // ("isLoggedIn === true && isLoginPage === true" -> dashboard) fires when an
    // already-authenticated operator loads/reloads the app on "#/". setFakeAuth
    // seeds the persisted token via addInitScript, so the store rehydrates
    // logged-in on boot and that branch runs on mount. Reverting just that line
    // back to "listeners" would go uncaught without this.
    await setFakeAuth(page);
    await page.goto("/");

    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
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

  test("network failure shows connection error and does not crash", async ({
    page,
  }) => {
    await page.route("**/token", (route) => route.abort());

    await loginViaForm(page, {
      url: "http://localhost:1337",
      username: "empireadmin",
      password: "password123",
    });

    await expect(page.getByText(/unable to connect to server/i)).toBeVisible();
    await expect(page).toHaveURL(/#\/$/);
  });
});
