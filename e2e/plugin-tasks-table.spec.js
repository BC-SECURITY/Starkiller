// e2e/plugin-tasks-table.spec.js
//
// Characterization tests for PluginTasksTable's plugin-specific divergences
// from AgentTasksTable (see agent-tasks-table.spec.js):
//   - Rerun always dispatches to pluginApi.executePlugin (no per-task-type
//     branching the way agent rerun has for module/shell/sysinfo).
//   - There is NO "Stop Task" action at all — plugin tasks have no
//     stop_job equivalent.
// Plus alignment pins for behavior the plugin table shares with the agent
// table: the expand chevron renders as the leftmost column (pluginTaskConfig
// declares data-table-expand at order 0 rather than letting Vuetify
// auto-append it on the right), and a HeaderMenu column selection survives
// remounts via the persisted pluginTaskHeaders store.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { navigateInApp } from "./helpers/navigation.js";
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

  test("expand chevron renders in the leftmost column", async ({ page }) => {
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    // Non-vacuity: the row has rendered its actions cell before we assert
    // on cell positions.
    const row = page.locator(".v-data-table tbody tr").first();
    await expect(row.locator("button:has(.fa-ellipsis-v)")).toBeVisible();
    await expect(
      row.locator("td").first().locator("button:has(.fa-chevron-down)"),
    ).toHaveCount(1);
  });

  test("header selection survives a remount via the persisted store", async ({
    page,
  }) => {
    // Regression: TasksTable.mounted() reseeds the persisted header store
    // whenever its legacy-shape guard fires. With the expand column
    // (title: "", defaultHeader: true) seeded at index 0, a guard of
    // `!store[0].title` fired on every mount and wiped the user's
    // HeaderMenu selection.
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Tags" }),
    ).toHaveCount(1);

    // Deselect "Tags" in the column picker and save.
    await page.locator("button:has(.mdi-format-columns)").click();
    const menu = page.locator(".v-overlay__content");
    await menu.getByLabel("Tags", { exact: true }).click();
    await menu.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator(".v-data-table th", { hasText: "Tags" }),
    ).toHaveCount(0);

    // Route away and back so PluginEdit — and TasksTable's mounted() —
    // runs again against the stored selection (navigateInApp, because
    // goto() wouldn't remount and reload() would reset the store).
    // The return route lands directly on ?tab=tasks because the default
    // Interact tab fires suggestion endpoints this spec doesn't mock.
    // Non-vacuity: another selected column must render after the round
    // trip, proving the table remounted with seeded headers.
    await navigateInApp(page, "#/plugins");
    // Positive proof PluginEdit unmounted: the plugins list renders no
    // data table. The breadcrumb link-name check alone is satisfiable on
    // the source page — PluginEdit's own breadcrumb renders plugin.name
    // as a link even while disabled — so without this the test could go
    // green against a table that never remounted.
    await expect(page.locator(".v-data-table")).toHaveCount(0);
    await expect(page.getByRole("link", { name: plugin.name })).toBeVisible();
    await navigateInApp(page, `#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Tags" }),
    ).toHaveCount(0);
  });

  test("deselecting every column and saving reseeds defaults on the next mount", async ({
    page,
  }) => {
    // Regression: HeaderMenu used to keep alwaysShow columns in its
    // working selection (they were seeded into selectedHeadersTemp, and
    // the old Select-All uncheck reassigned them as staticHeaders), so a
    // deselect-all save persisted [expand, Actions]. "Actions" has a
    // truthy title, which defeated the mount guard — the store never
    // reseeded and the table was stuck with zero data columns. alwaysShow
    // columns are no longer persisted at all: a deselect-all save writes
    // an empty store, which mounted() reseeds to defaults on remount.
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);

    await page.locator("button:has(.mdi-format-columns)").click();
    const menu = page.locator(".v-overlay__content");
    // Two clicks: check "Select All" (every selectable column), then
    // uncheck it (none), and save the empty selection.
    await menu.getByLabel("Select All", { exact: true }).click();
    await menu.getByLabel("Select All", { exact: true }).click();
    await menu.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(0);

    await navigateInApp(page, "#/plugins");
    await expect(page.locator(".v-data-table")).toHaveCount(0);
    await navigateInApp(page, `#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Tags" }),
    ).toHaveCount(1);
  });

  test("a legacy-shaped store with no titled entries reseeds to defaults", async ({
    page,
  }) => {
    // Pre-4.0 stores persisted {text, value} header objects. None of
    // those entries has a `title`, so mounted()'s reseed guard must fire
    // — otherwise nothing would match the current header shape and the
    // table would render only its alwaysShow columns.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.pluginTaskHeaders = [
        { text: "Status", value: "status" },
        { text: "Tags", value: "tags" },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    // Non-vacuity: the reseeded defaults must render while a
    // defaultHeader:false column stays hidden.
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Task ID" }),
    ).toHaveCount(0);
  });

  test("a store contaminated by a pre-fix deselect-all reseeds to defaults", async ({
    page,
  }) => {
    // Migration: a deselect-all save under the shipped 4.0.1 build
    // persisted exactly [Actions] — the plugin config's only alwaysShow
    // column back then (it gains the expand column in this release).
    // "Actions" has a truthy title, so without mounted() stripping
    // alwaysShow entries before the reseed guard, an already-affected
    // install would stay stuck showing only that column forever.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.pluginTaskHeaders = [
        {
          title: "Actions",
          key: "actions",
          sortable: false,
          defaultHeader: true,
          alwaysShow: true,
          order: 9,
        },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Task ID" }),
    ).toHaveCount(0);
  });

  test("cleaning a contaminated store preserves the user's real picks", async ({
    page,
  }) => {
    // Migration: alwaysShow entries persisted by older builds are
    // stripped, but a store that still holds titled real picks must NOT
    // be reseeded — the user's selection survives the cleanup.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.pluginTaskHeaders = [
        { title: "Actions", key: "actions", alwaysShow: true, order: 9 },
        { title: "Status", key: "status", defaultHeader: true, order: 2 },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await page.goto(`/#/plugins/${PLUGIN}?tab=tasks`);
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    // Tags is a default — if the store had been reseeded it would render.
    await expect(
      page.locator(".v-data-table th", { hasText: "Tags" }),
    ).toHaveCount(0);
  });
});
