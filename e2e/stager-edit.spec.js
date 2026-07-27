// e2e/stager-edit.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import {
  mockStagerDetail,
  mockStagerTemplates,
  mockStagerTemplate,
} from "./helpers/api/stagers.js";
import { defaultStagers, launcherTemplate } from "./fixtures/stagers.js";
import { jsonResponse } from "./helpers/responses.js";

test.describe("stager edit", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockGeneralFormBackground(page);
    await mockStagerTemplates(page, [launcherTemplate]);
    await mockStagerTemplate(page, launcherTemplate);
  });

  test("loads an existing stager", async ({ page }) => {
    await mockStagerDetail(page, defaultStagers[0]);
    await page.goto(`/#/stagers/${defaultStagers[0].id}`);
    await expect(page.getByLabel(/^name$/i)).toHaveValue(
      defaultStagers[0].name,
    );
  });

  // Regression test: getStager() applied whichever response landed last,
  // not whichever request was made last. Fast in-app navigation from
  // stager A to stager B, where A's (older) request resolves after B's
  // (newer) one, used to let A's stale data overwrite the view even though
  // the route already points at B.
  test("does not apply a stale getStager response after fast navigation to another stager", async ({
    page,
  }) => {
    const stagerA = defaultStagers[0]; // stager-1
    const stagerB = {
      id: 2,
      name: "stager-2",
      template: "multi_launcher",
      user_id: 1,
      options: { Listener: "http-1", Language: "python" },
    };

    let releaseA;
    const gateA = new Promise((resolve) => {
      releaseA = resolve;
    });
    await page.route(`**/api/v2/stagers/${stagerA.id}`, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await gateA;
      return route.fulfill(jsonResponse(stagerA));
    });
    await mockStagerDetail(page, stagerB);

    const requestA = page.waitForRequest(`**/api/v2/stagers/${stagerA.id}`);
    await page.goto(`/#/stagers/${stagerA.id}`);
    await requestA;

    // In-app navigation, not page.goto -- the same component instance's id
    // watcher must fire getStager(B).
    await page.evaluate((id) => {
      window.location.hash = `#/stagers/${id}`;
    }, stagerB.id);
    await expect(page.getByLabel(/^name$/i)).toHaveValue(stagerB.name);

    // Now let stager A's stale, superseded response land, and wait for the
    // page to actually receive and process it before asserting -- else this
    // would pass trivially without ever observing a wrongful overwrite.
    const responseA = page.waitForResponse(`**/api/v2/stagers/${stagerA.id}`);
    releaseA();
    await responseA;

    // The form must still show stager B's data.
    await expect(page.getByLabel(/^name$/i)).toHaveValue(stagerB.name);
  });

  // Regression test: the selectedTemplate watcher's own getStagerTemplate
  // fetch had no guard either -- switching template selection quickly could
  // let an older template's response overwrite a newer selection's data.
  test("does not apply a stale template response after rapidly switching template selection", async ({
    page,
  }) => {
    const dllTemplate = {
      id: "windows_dll",
      name: "windows_dll",
      description: "Windows DLL",
      authors: [],
      comments: [],
      options: {
        Listener: { value: "", required: true, description: "Listener" },
        Language: {
          value: "csharp",
          required: true,
          description: "Language",
        },
      },
    };
    await mockStagerTemplates(page, [launcherTemplate, dllTemplate]);

    let releaseLauncher;
    const launcherGate = new Promise((resolve) => {
      releaseLauncher = resolve;
    });
    await page.route(
      "**/api/v2/stager-templates/multi_launcher",
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await launcherGate;
        return route.fulfill(jsonResponse(launcherTemplate));
      },
    );
    await mockStagerTemplate(page, dllTemplate);

    await page.goto("/#/stagers/new");

    const launcherRequest = page.waitForRequest(
      "**/api/v2/stager-templates/multi_launcher",
    );
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page
      .getByRole("option", { name: "multi_launcher", exact: true })
      .click();
    await launcherRequest;

    // Switch to windows_dll before multi_launcher's (older) request resolves.
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page.getByRole("option", { name: "windows_dll" }).click();
    await expect(page.getByLabel("Language")).toHaveValue(
      dllTemplate.options.Language.value,
    );

    // Now let multi_launcher's stale, superseded response land.
    const launcherResponse = page.waitForResponse(
      "**/api/v2/stager-templates/multi_launcher",
    );
    releaseLauncher();
    await launcherResponse;

    // The form must still show windows_dll's data, not multi_launcher's.
    await expect(page.getByLabel("Language")).toHaveValue(
      dllTemplate.options.Language.value,
    );
  });

  // Regression test: InfoViewer used to render an empty, titleless expansion
  // panel before a template was selected. stagerTemplate starts as
  // `{ options: {} }`, so stagerInfo is `{ description, authors, comments }`
  // with all-undefined values -- present keys, no content -- which the old
  // Object.keys()-based guard mistook for "has info".
  test("does not show the info panel until a template with info is selected", async ({
    page,
  }) => {
    await page.goto("/#/stagers/new");

    const panel = page.locator(".info-viewer .v-expansion-panels");
    // Type field is up, but no template chosen yet -> no info panel.
    await expect(page.getByLabel(/^type$/i).first()).toBeVisible();
    await expect(panel).toHaveCount(0);

    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page
      .getByRole("option", { name: "multi_launcher", exact: true })
      .click();

    // Once the template loads, the panel appears showing its description.
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(launcherTemplate.description);
  });
});
