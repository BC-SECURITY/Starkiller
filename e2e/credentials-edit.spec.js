// e2e/credentials-edit.spec.js
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
  mockCredentialDetail,
  recordCredentialActions,
} from "./helpers/api/credentials.js";
import { defaultCredentials } from "./fixtures/credentials.js";

test.describe("credentials edit", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // CredentialEdit.vue renders a <general-form> which fires the
    // background fetches on mount.
    await mockGeneralFormBackground(page);
    await mockTagsEndpoint(page);
    await mockCredentialsList(page, defaultCredentials);
    await mockCredentialDetail(page, defaultCredentials[0]);
  });

  test("loads existing credential and PUTs an update", async ({ page }) => {
    const actions = recordCredentialActions(page);
    await page.goto(`/#/credentials/${defaultCredentials[0].id}`);

    // Form renders with existing values pre-filled.
    await expect(page.getByLabel(/^username$/i)).toHaveValue(
      defaultCredentials[0].username,
    );
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      defaultCredentials[0].host,
    );

    // Modify the password field.
    const password = page.getByLabel(/^password$/i);
    await password.fill("rotated-password");

    await page
      .getByRole("button", { name: /save|submit|update/i })
      .first()
      .click();

    // Exactly one PUT to /credentials/{id} must fire.
    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].method).toBe("PUT");
    expect(actions.calls[0].url).toMatch(
      new RegExp(`/credentials/${defaultCredentials[0].id}$`),
    );
    expect(actions.calls[0].body.password).toBe("rotated-password");
    // Username/host should be sent unchanged.
    expect(actions.calls[0].body.username).toBe(defaultCredentials[0].username);
    expect(actions.calls[0].body.host).toBe(defaultCredentials[0].host);
  });
});
