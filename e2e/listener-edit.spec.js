// e2e/listener-edit.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
  mockTagsEndpoint,
} from "./helpers/network.js";
import {
  mockListenerDetail,
  mockListenersList,
  mockListenerTemplates,
  mockListenerTemplate,
  recordListenerActions,
} from "./helpers/api/listeners.js";
import { defaultListeners, httpTemplate } from "./fixtures/listeners.js";
import { jsonResponse } from "./helpers/responses.js";

test.describe("listener edit", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockGeneralFormBackground(page);
    await mockTagsEndpoint(page);
    await mockListenerTemplates(page, [httpTemplate]);
    await mockListenerTemplate(page, httpTemplate);
  });

  test("loads an existing listener", async ({ page }) => {
    await mockListenerDetail(page, defaultListeners[0]);
    await page.goto(`/#/listeners/${defaultListeners[0].id}`);
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      defaultListeners[0].options.Host,
    );
  });

  // Regression test: getListener() applied whichever response landed last,
  // not whichever request was made last. Fast in-app navigation from
  // listener A to listener B, where A's (older) request resolves after B's
  // (newer) one, used to let A's stale data overwrite the view even though
  // the route already points at B.
  test("does not apply a stale getListener response after fast navigation to another listener", async ({
    page,
  }) => {
    const listenerA = defaultListeners[0]; // http-1, port 80
    const listenerB = defaultListeners[1]; // http-2-stopped, port 8080

    let releaseA;
    const gateA = new Promise((resolve) => {
      releaseA = resolve;
    });
    await page.route(`**/api/v2/listeners/${listenerA.id}`, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await gateA;
      return route.fulfill(jsonResponse(listenerA));
    });
    await mockListenerDetail(page, listenerB);

    const requestA = page.waitForRequest(`**/api/v2/listeners/${listenerA.id}`);
    await page.goto(`/#/listeners/${listenerA.id}`);
    await requestA;

    // In-app navigation, not page.goto -- the same component instance's id
    // watcher must fire getListener(B).
    await page.evaluate((id) => {
      window.location.hash = `#/listeners/${id}`;
    }, listenerB.id);
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      listenerB.options.Host,
    );

    // Now let listener A's stale, superseded response land, and wait for
    // the page to actually receive and process it before asserting -- else
    // this would pass trivially without ever observing a wrongful overwrite.
    const responseA = page.waitForResponse(
      `**/api/v2/listeners/${listenerA.id}`,
    );
    releaseA();
    await responseA;

    // The form must still show listener B's data (different Port value).
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      listenerB.options.Host,
    );
  });

  // Regression test: the selectedTemplate watcher's own getListenerTemplate
  // fetch had no guard either -- switching template selection quickly could
  // let an older template's response overwrite a newer selection's data.
  // Uses the "new listener" flow (canEdit is always true there) since an
  // existing enabled listener's Type field is read-only.
  test("does not apply a stale template response after rapidly switching template selection", async ({
    page,
  }) => {
    const httpsTemplate = {
      id: "https",
      name: "https",
      description: "HTTPS listener",
      options: {
        Name: { value: "", required: true, description: "Name" },
        Host: {
          value: "https://0.0.0.0",
          required: true,
          description: "Host",
        },
        Port: { value: "443", required: true, description: "Port" },
      },
    };
    await mockListenerTemplates(page, [httpTemplate, httpsTemplate]);

    let releaseHttp;
    const httpGate = new Promise((resolve) => {
      releaseHttp = resolve;
    });
    await page.route("**/api/v2/listener-templates/http", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await httpGate;
      return route.fulfill(jsonResponse(httpTemplate));
    });
    await mockListenerTemplate(page, httpsTemplate);

    await page.goto("/#/listeners/new");

    const httpRequest = page.waitForRequest(
      "**/api/v2/listener-templates/http",
    );
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page.getByRole("option", { name: "http", exact: true }).click();
    await httpRequest;

    // Switch to https before http's (older) request resolves.
    await page
      .getByLabel(/^type$/i)
      .first()
      .click();
    await page.getByRole("option", { name: "https" }).click();
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      httpsTemplate.options.Host.value,
    );

    // Now let http's stale, superseded response land.
    const httpResponse = page.waitForResponse(
      "**/api/v2/listener-templates/http",
    );
    releaseHttp();
    await httpResponse;

    // The form must still show https's data, not http's.
    await expect(page.getByLabel(/^host$/i)).toHaveValue(
      httpsTemplate.options.Host.value,
    );
    await expect(page.getByLabel(/^port$/i)).toHaveValue(
      httpsTemplate.options.Port.value,
    );
  });

  // Regression test: toggleEnabled() had no guard against a second toggle
  // firing while the first updateListener call was still in flight.
  test("toggling Enabled twice quickly only sends one updateListener request", async ({
    page,
  }) => {
    // http-2-stopped: enabled: false, so canEdit is true and the switch
    // starts in the "off" position -- clicking it means val === true, which
    // shows a confirm dialog before toggleEnabled's PUT actually fires.
    const listener = defaultListeners[1];
    await mockListenerDetail(page, listener);

    let releaseUpdate;
    const updateGate = new Promise((resolve) => {
      releaseUpdate = resolve;
    });
    const calls = [];
    await page.route(`**/api/v2/listeners/${listener.id}`, async (route) => {
      if (route.request().method() !== "PUT") return route.fallback();
      calls.push(route.request().url());
      await updateGate;
      return route.fulfill(jsonResponse({ ...listener, enabled: true }));
    });

    await page.goto(`/#/listeners/${listener.id}`);
    await expect(page.getByLabel(/^host$/i)).toHaveValue(listener.options.Host);

    // Vuetify v-switch renders as input[type="checkbox"]; getByLabel picks
    // the one associated with the "Enabled" label.
    const toggle = page.getByLabel(/^enabled$/i);
    const firstRequest = page.waitForRequest(
      `**/api/v2/listeners/${listener.id}`,
    );
    await toggle.click();
    await page.getByRole("button", { name: "Yes" }).click();
    await firstRequest;

    // Click again while the first update is still pending. It's already
    // "on" visually, so this click means val === false -- no confirm
    // dialog on that path.
    await toggle.click({ force: true });

    releaseUpdate();
    await expect.poll(() => calls.length).toBe(1);
  });

  test("kill posts a DELETE and navigates to the list", async ({ page }) => {
    const listener = defaultListeners[0];
    await mockListenerDetail(page, listener);
    // Kill navigates to the listeners list on success -- stub it too.
    await mockListenersList(page, defaultListeners);
    const actions = recordListenerActions(page);

    await page.goto(`/#/listeners/${listener.id}`);
    await expect(page.getByLabel(/^host$/i)).toHaveValue(listener.options.Host);

    await page.locator("button:has(.fa-trash-alt)").click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect
      .poll(() => actions.calls.filter((c) => c.method === "DELETE").length)
      .toBe(1);
    await expect(page).toHaveURL(/#\/listeners$/);
  });
});
