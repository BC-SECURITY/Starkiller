// e2e/listener-create.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import { jsonResponse } from "./helpers/responses.js";
import {
  mockListenerTemplates,
  mockListenerTemplate,
} from "./helpers/api/listeners.js";
import { httpTemplate } from "./fixtures/listeners.js";

test.describe("listener create", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // GeneralForm.vue fetches agents, listeners, bypasses, and malleable-profiles
    // on mount. These must be stubbed before the form renders.
    await mockGeneralFormBackground(page);
    // The store fetches templates from GET /listener-templates (not /listeners/templates).
    await mockListenerTemplates(page, [httpTemplate]);
    // Single-template GET: the selectedTemplate watcher fetches by id to load
    // the template options before the form renders (initialLoad becomes true).
    await mockListenerTemplate(page, httpTemplate);
  });

  test("submits a POST to /listeners with the filled options", async ({
    page,
  }) => {
    const calls = [];

    // The createListener API posts to the bare collection endpoint /listeners,
    // which does NOT match the **/api/v2/listeners/* glob used by
    // recordListenerActions. Register a separate handler for the collection.
    await page.route("**/api/v2/listeners", async (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        calls.push({ url: route.request().url(), method: "POST", body });
        return route.fulfill(jsonResponse({ id: 99, ...body }, 201));
      }
      return route.fallback();
    });

    await page.goto("/#/listeners/new");

    // The form uses a v-autocomplete with label="Type" for the template picker.
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page.getByRole("option", { name: "http" }).click();

    // Wait for the form to render (initialLoad = true after template fetch).
    await expect(page.getByLabel(/^name$/i)).toBeVisible();

    // Fill the Name field (Host and Port already have defaults from the template).
    await page.getByLabel(/^name$/i).fill("my-test-listener");

    // Submit — EditPageTop renders a button wired to @submit="submit".
    await page
      .getByRole("button", { name: /submit|create|save/i })
      .first()
      .click();

    await expect
      .poll(() => calls.find((c) => c.method === "POST"))
      .toBeDefined();

    const created = calls.find((c) => c.method === "POST");
    expect(created.body.name).toBe("my-test-listener");
    expect(created.body.template).toBe("http");
  });
});
