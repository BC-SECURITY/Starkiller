// e2e/notifications.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { seedNotifications } from "./helpers/api/notifications.js";
import { defaultNotifications } from "./fixtures/notifications.js";

test.describe("notifications panel", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    // Order matters: seedNotifications must run after setFakeAuth so it
    // edits the value setFakeAuth already wrote.
    await seedNotifications(page, defaultNotifications);
    await mockEmpireBootstrap(page);
  });

  test("renders seeded notifications", async ({ page }) => {
    await page.goto("/#/notifications");
    for (const n of defaultNotifications) {
      await expect(page.getByText(n.title)).toBeVisible();
    }
  });
});
