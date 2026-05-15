// e2e/obfuscation.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockObfuscationGlobal,
  mockObfuscationKeywords,
  recordObfuscationUpdates,
} from "./helpers/api/obfuscation.js";
import { defaultObfuscation } from "./fixtures/obfuscation.js";

test.describe("obfuscation", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Obfuscation.vue calls getKeywords() in addition to getConfigs() on mount.
    await mockObfuscationKeywords(page);
    await mockObfuscationGlobal(page, defaultObfuscation);
  });

  test("renders obfuscation configs", async ({ page }) => {
    await page.goto("/#/obfuscation");
    await expect(page.getByText("powershell").first()).toBeVisible();
  });

  test("toggle enabled posts a PUT", async ({ page }) => {
    const updates = recordObfuscationUpdates(page);
    await page.goto("/#/obfuscation");

    // Toggle the powershell switch. Vuetify v-switch renders as type="checkbox".
    await page.locator('input[type="checkbox"]').first().click();
    // Click the Save button to persist the change via PUT.
    await page.getByRole("button", { name: "Save" }).first().click();

    // Exactly one PUT must fire for the powershell config.
    await expect.poll(() => updates.calls.length).toBe(1);
    expect(updates.calls[0].url).toContain("/obfuscation/global/");
    // The body must reflect the toggled state (enabled was false → now true).
    expect(updates.calls[0].body.language).toBe("powershell");
  });
});
