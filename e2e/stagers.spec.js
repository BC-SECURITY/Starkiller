// e2e/stagers.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import {
  mockStagersList,
  mockStagerTemplates,
  mockStagerTemplate,
  recordStagerCreate,
} from "./helpers/api/stagers.js";
import { defaultStagers, launcherTemplate } from "./fixtures/stagers.js";
import { jsonResponse } from "./helpers/responses.js";

test.describe("stagers", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
  });

  test("renders stagers list", async ({ page }) => {
    await mockStagersList(page, defaultStagers);
    await page.goto("/#/stagers");
    await expect(page.getByText("stager-1")).toBeVisible();
  });

  test("create stager posts to /stagers", async ({ page }) => {
    await mockStagerTemplates(page, [launcherTemplate]);
    await mockStagerTemplate(page, launcherTemplate);
    const create = recordStagerCreate(page);
    // GeneralForm.vue fetches agents, listeners, bypasses, malleable-profiles,
    // and credentials on mount (both the create form and the edit page it
    // redirects to after creation). Stub all five before goto.
    await mockGeneralFormBackground(page);
    // After a successful create, StagerEdit.vue redirects to the stager detail
    // page (stagerEdit with id=99) which calls getStager(id). Stub it so the
    // subsequent page load doesn't produce unmocked-API errors.
    await page.route("**/api/v2/stagers/*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(
        jsonResponse({
          id: 99,
          name: "test-stager",
          template: "multi_launcher",
        }),
      );
    });
    await page.goto("/#/stagers/new");

    // The form uses a v-autocomplete with label="Type" for the template picker.
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page.getByRole("option", { name: "multi_launcher" }).click();

    // Wait for the form to render (initialLoad = true after template fetch).
    await expect(page.getByLabel(/^name$/i)).toBeVisible();

    // Fill the Name field so the stager has a name.
    await page.getByLabel(/^name$/i).fill("test-stager");

    // Fill the required Listener field. DynamicFormInput uses :label="name"
    // so the field label is exactly "Listener".
    await page.getByLabel("Listener").fill("http-1");

    // Submit — EditPageTop renders a button wired to @submit="submit".
    await page
      .getByRole("button", { name: /submit|create|save/i })
      .first()
      .click();

    // Exactly one POST must fire — no duplicate submissions.
    await expect.poll(() => create.calls.length).toBe(1);
    expect(create.calls[0].body.template).toBe("multi_launcher");
    expect(create.calls[0].body.name).toBe("test-stager");
  });
});
