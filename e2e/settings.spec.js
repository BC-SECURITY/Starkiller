// e2e/settings.spec.js
//
// Settings.vue exposes two v-switch elements bound to the Pinia application
// store, which is persisted via pinia-plugin-persistedstate to localStorage
// under the key "application".
//
// The view has:
//   - chatWidget (label: "Chat Widget") — starts true in setFakeAuth
//   - autoSubscribeAgents (no v-switch label; heading reads "Auto-Subscribe to Agents")
//
// There is NO "hide stale agents" toggle in Settings.vue; that flag exists in
// the store but is toggled elsewhere (e.g. agents-list filters). We test
// chatWidget here since it carries an explicit accessible label.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
  });

  test("toggling 'Chat Widget' persists to localStorage", async ({ page }) => {
    await page.goto("/#/settings");

    // chatWidget starts true (set in setFakeAuth). We uncheck it → false.
    // Vuetify 4 v-switch renders as input[type=checkbox] associated to a label.
    const toggle = page.getByLabel("Chat Widget");
    await expect(toggle).toBeChecked();
    await toggle.uncheck();

    // The Pinia persist plugin writes back to localStorage synchronously on
    // state mutation. Read it after the click settles.
    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("application") || "{}"),
    );
    expect(persisted.chatWidget).toBe(false);
  });

  test("toggling 'Auto-Subscribe to Agents' persists to localStorage", async ({
    page,
  }) => {
    await page.goto("/#/settings");

    // autoSubscribeAgents starts true. The switch has no v-switch :label
    // binding, so we locate it relative to its section heading.
    // Vuetify 4 renders v-switch as a checkbox; grab the only checkbox
    // inside the div that contains the "Auto-Subscribe to Agents" heading.
    const section = page
      .locator("div.headers")
      .filter({ hasText: /auto-subscribe/i });
    const toggle = section.locator('input[type="checkbox"]');
    await expect(toggle).toBeChecked();
    await toggle.uncheck();

    const persisted = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("application") || "{}"),
    );
    expect(persisted.autoSubscribeAgents).toBe(false);
  });
});
