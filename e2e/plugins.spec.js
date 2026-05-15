// e2e/plugins.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockInstalledPlugins,
  mockPluginMarketplace,
} from "./helpers/api/plugins.js";
import {
  defaultInstalledPlugins,
  defaultMarketplacePlugins,
} from "./fixtures/plugins.js";

test.describe("plugins", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
  });

  test("renders installed plugins", async ({ page }) => {
    await mockInstalledPlugins(page, defaultInstalledPlugins);
    await page.goto("/#/plugins");
    await expect(page.getByText("example-plugin")).toBeVisible();
  });

  test("renders marketplace listings", async ({ page }) => {
    await mockPluginMarketplace(page, defaultMarketplacePlugins);
    await page.goto("/#/plugin-marketplace");
    await expect(page.getByText("marketplace-plugin")).toBeVisible();
  });
});
