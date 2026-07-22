// e2e/autorun-modules.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import {
  mockListenerTemplates,
  mockListenerTemplate,
} from "./helpers/api/listeners.js";
import { mockModulesList } from "./helpers/api/modules.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import { defaultListeners, httpTemplate } from "./fixtures/listeners.js";

// A module whose options include a field ("AdvancedOption") that only
// applies when another field ("Mode") is set to a specific value, plus the
// "Agent" field AutoRunModules must always exclude (an autorun task runs on
// whichever agent later executes it, not a fixed one picked in this dialog).
const DEPENDS_ON_MODULE = {
  id: "test_depends_on_module",
  name: "test_depends_on_module",
  language: "python",
  description: "Module with a depends_on relationship",
  needs_admin: false,
  opsec_safe: false,
  background: false,
  enabled: true,
  techniques: [],
  options: {
    Agent: { value: "", required: true, description: "Agent" },
    Mode: { value: "basic", required: true, description: "Mode" },
    AdvancedOption: {
      value: "",
      required: false,
      description: "Only used in advanced mode",
      depends_on: [{ name: "Mode", values: ["advanced"] }],
    },
  },
};

test.describe("autorun modules — depends_on", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // ListenerEdit's "view" tab renders <general-form>, which mounts
    // regardless of which tab is active (v-window keeps all v-window-items in
    // the DOM). Must be stubbed before the form renders.
    await mockGeneralFormBackground(page);
    await mockListenerTemplates(page, [httpTemplate]);
    await mockListenerTemplate(page, httpTemplate);
    // mockGeneralFormBackground's listeners route falls back on the detail
    // path (/listeners/1) — stub it separately for ListenerEdit's own fetch.
    await page.route("**/api/v2/listeners/1", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(jsonResponse(defaultListeners[0]));
    });
    // AutoRunModules fetches autorun tasks as soon as its selectedListener
    // prop is truthy — including the parent's placeholder `{ options: {} }`
    // before getListener() resolves with the real id. Match any id so both
    // that transient call and the real one for id 1 succeed.
    await page.route("**/api/v2/listeners/*/autorun", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse([]));
    });
    await mockModulesList(page, [DEPENDS_ON_MODULE]);
  });

  test("hides the Agent field and a depends_on field until its dependency is met", async ({
    page,
  }) => {
    await page.goto("/#/listeners/1?tab=autorun");

    await page.getByRole("combobox", { name: "Select Module to Add" }).click();
    await page.getByRole("option", { name: DEPENDS_ON_MODULE.id }).click();
    await page.getByRole("button", { name: "Add Module" }).click();

    await page.getByRole("button", { name: "Edit Options" }).click();

    // The dialog is open and renders the visible fields.
    await expect(page.getByLabel("Mode", { exact: true })).toBeVisible();

    // "Agent" is never shown — AutoRunModules always excludes it.
    await expect(page.getByLabel("Agent", { exact: true })).toHaveCount(0);

    // "AdvancedOption" depends_on Mode === "advanced"; Mode defaults to
    // "basic", so it must not render.
    await expect(
      page.getByLabel("AdvancedOption", { exact: true }),
    ).toHaveCount(0);

    // Satisfy the dependency — the field should now appear.
    await page.getByLabel("Mode", { exact: true }).fill("advanced");
    await expect(
      page.getByLabel("AdvancedOption", { exact: true }),
    ).toBeVisible();
  });
});
