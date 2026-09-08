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

  test("renders homepage/source/author links as clickable for safe URLs", async ({
    page,
  }) => {
    await mockPluginMarketplace(page, [
      {
        name: "safe-plugin",
        installed: false,
        installed_version: null,
        registries: {
          main: {
            name: "main",
            description: "desc",
            authors: [{ name: "Alice", link: "https://example.com/alice" }],
            homepage_url: "https://example.com/home",
            source_url: "https://example.com/src",
            versions: [{ name: "1.0.0" }],
          },
        },
      },
    ]);
    await page.goto("/#/plugin-marketplace");
    await page.getByText("safe-plugin").click();

    await expect(page.locator("a", { hasText: "Alice" })).toHaveAttribute(
      "href",
      "https://example.com/alice",
    );
    await expect(page.locator("a", { hasText: "Homepage" })).toHaveAttribute(
      "href",
      "https://example.com/home",
    );
    await expect(page.locator("a", { hasText: "Source Code" })).toHaveAttribute(
      "href",
      "https://example.com/src",
    );
  });

  // Regression test: AuthorChips.vue and PluginMarketplace.vue bound href
  // directly from untrusted marketplace metadata with no scheme
  // validation, so a javascript: URI would render as an ordinary link and
  // execute attacker JS in-origin when clicked.
  test("does not render javascript: URIs as clickable links (XSS guard)", async ({
    page,
  }) => {
    await mockPluginMarketplace(page, [
      {
        name: "evil-plugin",
        installed: false,
        installed_version: null,
        registries: {
          main: {
            name: "main",
            description: "desc",
            authors: [
              { name: "Mallory", link: "javascript:window.__xss=true" },
            ],
            homepage_url: "javascript:window.__xss=true",
            source_url: "javascript:window.__xss=true",
            versions: [{ name: "1.0.0" }],
          },
        },
      },
    ]);
    await page.goto("/#/plugin-marketplace");
    await page.getByText("evil-plugin").click();

    // All three must render as plain text, not anchors — a javascript:
    // href would otherwise execute on click regardless of target/rel.
    await expect(page.getByText("Mallory")).toBeVisible();
    await expect(page.locator("a", { hasText: "Mallory" })).toHaveCount(0);
    await expect(page.getByText("Homepage")).toBeVisible();
    await expect(page.locator("a", { hasText: "Homepage" })).toHaveCount(0);
    await expect(page.getByText("Source Code")).toBeVisible();
    await expect(page.locator("a", { hasText: "Source Code" })).toHaveCount(0);
  });
});
