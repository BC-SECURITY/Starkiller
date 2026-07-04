// e2e/plugin-tasks-table.spec.js
//
// Characterization tests for PluginTasksTable's plugin-specific divergences
// from AgentTasksTable (see agent-tasks-table.spec.js):
//   - Rerun always dispatches to pluginApi.executePlugin (no per-task-type
//     branching the way agent rerun has for module/shell/sysinfo).
//   - There is NO "Stop Task" action at all — plugin tasks have no
//     stop_job equivalent.
// Both must PASS against the current, unmodified PluginTasksTable.vue.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import { mockInstalledPlugins } from "./helpers/api/plugins.js";
import { mockUsersList } from "./helpers/api/users.js";
import { defaultInstalledPlugins } from "./fixtures/plugins.js";

const plugin = defaultInstalledPlugins[0];
const PLUGIN = plugin.id; // 1

// A task row with every field the PluginTasksTable template reads.
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

function recordPluginExecute(page) {
  const calls = [];
  page.route("**/api/v2/plugins/*/execute", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    calls.push(route.request().url());
    return route.fulfill(jsonResponse({ id: 1, status: "queued" }, 201));
  });
  return { calls };
}

test.describe("plugin tasks table", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockInstalledPlugins(page, defaultInstalledPlugins);
    // PluginTasksList.mounted() also fires userStore.getUsers() (populates
    // the Users filter, which is what actually seeds selectedUsers so the
    // table's own getTasks() doesn't short-circuit on "no filters
    // selected") and getTags({sources: "plugin_task"}). Neither is covered
    // by mockInstalledPlugins, so without these they'd hit the
    // blockUnmockedApi 599 fallback and trip the consoleGuard.
    await mockUsersList(page, []);
    await mockTagsEndpoint(page);
    // PluginEdit.mounted() calls pluginApi.getPlugin(id), which — despite
    // the "endpoint appears to be broken" comment in plugin-api.js — still
    // issues a real GET /plugins/{id}. Left unmocked it 599s, getPlugin()'s
    // .catch sets errorState = true, and the whole v-window (tasks tab
    // included) is replaced by <error-state-alert>. mockInstalledPlugins
    // explicitly falls through for this path, so it must be mocked here.
    await page.route(`**/api/v2/plugins/${PLUGIN}`, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(jsonResponse(plugin));
    });
    // Task-list GET. PluginTasksList passes the `plugin` prop, so
    // PluginTasksTable's selectedPlugins is always a non-empty array
    // ([pluginId]) — pluginApi.getTasks() then special-cases the array
    // sessionId and hits the *plural* /plugins/tasks endpoint (with a
    // `plugins=` query param), NOT /plugins/{id}/tasks. The optional
    // `([^/]+\/)?` group also matches the singular shape so this stays
    // robust if that ever changes.
    await page.route(/\/api\/v2\/plugins\/([^/]+\/)?tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse([taskRow()]));
    });
    await page.route(/\/api\/v2\/plugins\/[^/]+\/tasks\/\d+$/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(jsonResponse(taskRow()));
    });
  });

  async function openRowMenu(page) {
    // Scope to the data table wrapper. Unlike the agent spec, there's no
    // observed fa-ellipsis-v collision on the plugin page (PluginEdit has
    // no comparable toolbar button) — this scoping is defensive/for
    // consistency with the agent spec, not fixing an actual collision here.
    await page
      .locator(".v-data-table")
      .locator("button:has(.fa-ellipsis-v)")
      .first()
      .click();
  }

  test("rerun calls executePlugin", async ({ page }) => {
    const exec = recordPluginExecute(page);
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Rerun Task").click();
    await expect.poll(() => exec.calls.length).toBe(1);
  });

  test("has no Stop Task action", async ({ page }) => {
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await openRowMenu(page);
    await expect(page.getByText("Rerun Task")).toBeVisible();
    await expect(page.getByText("Stop Task")).toHaveCount(0);
  });
});
