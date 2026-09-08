// e2e/tags.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockTagsRegistry,
  recordTagRegistryActions,
} from "./helpers/api/tags.js";
import { defaultTags } from "./fixtures/tags.js";

test.describe("tags management page", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockTagsRegistry(page, defaultTags);
  });

  test("lists tags with usage counts", async ({ page }) => {
    await page.goto("/#/tags");
    // Exact match: "prod"'s own description is "Production", which also
    // renders in the row's Description column and (via TagChip's tooltip)
    // its title attribute — both contain "prod" as a substring.
    await expect(page.getByText("prod", { exact: true })).toBeVisible();
    await expect(page.getByText("qa", { exact: true })).toBeVisible();
  });

  test("create posts the new tag", async ({ page }) => {
    const actions = recordTagRegistryActions(page);
    await page.goto("/#/tags");
    await page
      .getByRole("button", { name: /create|new/i })
      .first()
      .click();
    await page.getByLabel(/^name$/i).fill("staging");
    await page.getByRole("button", { name: /save/i }).click();
    await expect
      .poll(() => actions.calls.filter((c) => c.method === "POST").length)
      .toBe(1);
    expect(actions.calls.find((c) => c.method === "POST").body.name).toBe(
      "staging",
    );
  });
});
