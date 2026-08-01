// e2e/credentials.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
  mockTagsEndpoint,
} from "./helpers/network.js";
import {
  mockCredentialsList,
  recordCredentialActions,
} from "./helpers/api/credentials.js";
import { defaultCredentials } from "./fixtures/credentials.js";

test.describe("credentials", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // GeneralForm.vue fetches agents, listeners, bypasses, malleable-profiles
    // on mount in both the list view (Credentials.vue embeds it? No — but
    // CredentialEdit.vue does for the create form). Also covers background
    // fetches that fire when the app shell initialises after auth.
    await mockGeneralFormBackground(page);
    // Tags endpoint: Credentials.vue calls getTags() on mount.
    await mockTagsEndpoint(page);
    await mockCredentialsList(page, defaultCredentials);
  });

  test("renders credentials list", async ({ page }) => {
    await page.goto("/#/credentials");
    // Scope to the data table to avoid matching hidden nav items in the sidebar.
    const table = page.locator(".v-data-table");
    await expect(table).toBeVisible();
    for (const c of defaultCredentials) {
      await expect(table.getByText(c.username).first()).toBeVisible();
    }
  });

  test("create posts a new credential", async ({ page }) => {
    const actions = recordCredentialActions(page);
    await page.goto("/#/credentials/new");

    // credtype is required (CredentialEdit.vue options: required: true, strict: true).
    // It uses a dropdown (suggested_values: ["plaintext", "hash"]).
    await expect(page.getByLabel(/^credtype$/i)).toBeVisible();
    await page.getByLabel(/^credtype$/i).click();
    await page.getByRole("option", { name: /plaintext/i }).click();

    await page.getByLabel(/^username$/i).fill("newuser");
    await page.getByLabel(/^password$/i).fill("newpass");
    await page.getByLabel(/^host$/i).fill("HOST01");

    // domain is required by CredentialEdit.vue options.
    await expect(page.getByLabel(/^domain$/i)).toBeVisible();
    await page.getByLabel(/^domain$/i).fill("TEST");

    await page
      .getByRole("button", { name: /save|create|submit/i })
      .first()
      .click();

    // Exactly one POST must fire — no duplicate submissions.
    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].body.username).toBe("newuser");
    expect(actions.calls[0].body.host).toBe("HOST01");
    expect(actions.calls[0].body.credtype).toBe("plaintext");
    expect(actions.calls[0].body.domain).toBe("TEST");
  });
});
