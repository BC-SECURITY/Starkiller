// e2e/plugin-tasks-list.spec.js
//
// Regression test for PluginTasksList.vue's mounted() hook, which used to
// call Promise.all([getPlugins(), getUsers(), getTags()]) with no
// surrounding try/catch (unlike the sibling AgentTasksList.vue). A single
// rejected call -- e.g. userStore.getUsers() blanking out on one bad
// avatar (see user-module.spec.js) -- threw uncaught and broke the whole
// tasks tab, not just the affected filter.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import { mockInstalledPlugins } from "./helpers/api/plugins.js";
import { defaultInstalledPlugins } from "./fixtures/plugins.js";

const plugin = defaultInstalledPlugins[0];
const PLUGIN = plugin.id;

function taskRow(overrides = {}) {
  return {
    id: 3,
    plugin_id: PLUGIN,
    status: "completed",
    task_name: "run",
    module_name: null,
    input: "do-thing",
    full_input: "do-thing",
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    tags: [],
    downloads: [],
    ...overrides,
  };
}

test.describe("plugin tasks list", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockInstalledPlugins(page, defaultInstalledPlugins);
    await mockTagsEndpoint(page);
    await page.route(`**/api/v2/plugins/${PLUGIN}`, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(jsonResponse(plugin));
    });
    await page.route(/\/api\/v2\/plugins\/([^/]+\/)?tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse([taskRow()]));
    });
  });

  test("a failed getUsers() surfaces an error but still loads the task list (regression: uncaught Promise.all in mounted())", async ({
    page,
  }) => {
    await page.route("**/api/v2/users*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });

    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);

    // The task list itself (from the unrelated, successful getTasks() call)
    // must still render -- a failed getUsers() must not block it. "input"
    // only shows once a row is expanded, so assert on the pagination
    // footer instead, which reflects the single seeded task row.
    await expect(page.getByText("1-1 of 1")).toBeVisible();

    // Dismiss the "recommended Empire version" compat banner -- it's queued
    // through the same snackbar as our error toast and would otherwise
    // delay it past the assertion timeout below.
    await page.locator("button:has(.fa-times)").click();
    await expect(page.getByText(/failed to load filter data/i)).toBeVisible();
  });
});
