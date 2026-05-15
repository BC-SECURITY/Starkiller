// e2e/malleable-profiles-crud.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockMalleableProfilesList,
  mockMalleableProfileDetail,
  recordMalleableProfileActions,
} from "./helpers/api/malleable.js";
import { defaultMalleableProfiles } from "./fixtures/malleable.js";

test.describe("malleable profiles", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockMalleableProfilesList(page, defaultMalleableProfiles);
  });

  test("renders list", async ({ page }) => {
    await page.goto("/#/malleable-profiles");
    const table = page.locator(".v-data-table");
    await expect(table).toBeVisible();
    for (const p of defaultMalleableProfiles) {
      await expect(table.getByText(p.name).first()).toBeVisible();
    }
  });

  test("create posts a new profile", async ({ page }) => {
    const actions = recordMalleableProfileActions(page);
    // After POST returns id 99, MalleableProfileEdit.vue navigates to
    // /#/malleable-profiles/99 which fetches the new profile. Stub it to
    // avoid an unmocked GET firing during teardown.
    await mockMalleableProfileDetail(page, {
      id: 99,
      name: "test-profile",
      category: "custom",
      data: "set sample_name 'Test';",
    });
    await page.goto("/#/malleable-profiles/new");

    // Name is required and must be > 3 chars (MalleableProfileEdit.vue rules).
    await page.getByLabel(/^name$/i).fill("test-profile");
    await page.getByLabel(/^category$/i).fill("custom");
    await page.getByLabel(/^code$/i).fill("set sample_name 'Test';");

    await page
      .getByRole("button", { name: /save|submit|create/i })
      .first()
      .click();

    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].method).toBe("POST");
    expect(actions.calls[0].body.name).toBe("test-profile");
    expect(actions.calls[0].body.category).toBe("custom");
    // The API field is `data` (createMalleableProfile maps `code` → `data`).
    expect(actions.calls[0].body.data).toBe("set sample_name 'Test';");
  });

  test("edit sends a PUT with updated code", async ({ page }) => {
    await mockMalleableProfileDetail(page, defaultMalleableProfiles[0]);
    const actions = recordMalleableProfileActions(page);

    await page.goto(`/#/malleable-profiles/${defaultMalleableProfiles[0].id}`);

    // Code field pre-populates from the loaded profile.
    const code = page.getByLabel(/^code$/i);
    await expect(code).toHaveValue(defaultMalleableProfiles[0].data);

    await code.fill("set sample_name 'Updated';");
    await page
      .getByRole("button", { name: /save|submit|update/i })
      .first()
      .click();

    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].method).toBe("PUT");
    expect(actions.calls[0].url).toMatch(
      new RegExp(`/malleable-profiles/${defaultMalleableProfiles[0].id}$`),
    );
    // updateMalleableProfile only sends { data: code }.
    expect(actions.calls[0].body.data).toBe("set sample_name 'Updated';");
  });
});
