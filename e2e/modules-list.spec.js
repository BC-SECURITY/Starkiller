// e2e/modules-list.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockModulesList } from "./helpers/api/modules.js";
import { defaultModules } from "./fixtures/modules.js";

test.describe("modules list", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockModulesList(page, defaultModules);
  });

  test("renders all modules", async ({ page }) => {
    await page.goto("/#/modules");
    // The Language ExpansionPanelFilter auto-selects all languages after
    // modules load (items watcher fires → emptyDefault=false → select all).
    // Wait for all module names to appear in the table.
    for (const m of defaultModules) {
      await expect(page.getByText(m.name).first()).toBeVisible();
    }
  });

  test("filters by search term", async ({ page }) => {
    await page.goto("/#/modules");
    // Wait for table to populate before interacting with filters.
    await expect(
      page.getByText("powershell_collection_screenshot").first(),
    ).toBeVisible();

    // The search input lives inside the "Search" expansion panel.
    // Click the panel title to expand it, then fill the text field.
    await page.getByRole("button", { name: /^Search$/ }).click();
    await page.getByLabel("Search").fill("python");

    // Only the python module should remain visible; powershell ones should hide.
    await expect(
      page.getByText("python_collection_linux_pillage"),
    ).toBeVisible();
    await expect(
      page.getByText("powershell_collection_screenshot"),
    ).toBeHidden();
  });
});
