// e2e/helpers/api/plugins.js
//
// mockInstalledPlugins: intercepts GET /api/v2/plugins (list only).
//   Falls through on non-GET, on /plugins/marketplace, and on detail
//   routes (/plugins/<id>).
//
// mockPluginMarketplace: intercepts GET /api/v2/plugin-registries/marketplace.
//   Verified from src/api/plugin-api.js getMarketplace() and
//   src/components/plugins/PluginMarketplace.vue refreshMarketplace().
//   The response uses { records: [...] } – the same paginated envelope
//   as every other list endpoint.
//
// mockPluginDetail: intercepts GET /api/v2/plugins/<id> (single-plugin
//   detail), the route PluginEdit.vue's getPlugin() hits on mount.
//
// mockPluginTasks: intercepts GET /api/v2/plugins/tasks (the AGGREGATE task
//   feed). PluginTasksTable always calls TasksTable's adapter with an ARRAY
//   `selected` — even the single-plugin case (PluginEdit's Tasks tab passes
//   `[plugin.id]` via its immediate `plugin` watcher) — so pluginApi.getTasks'
//   `Array.isArray(pluginId)` branch always wins and every caller in this app
//   hits this one aggregate URL; the bare `/plugins/{id}/tasks` form that
//   function also supports is dead code from the UI's perspective and does
//   not need its own mock here.
import { jsonResponse, paginatedResponse } from "../responses.js";

const INSTALLED = "**/api/v2/plugins*";
const MARKETPLACE = "**/api/v2/plugin-registries/marketplace*";
const PLUGIN_DETAIL = (id) => `**/api/v2/plugins/${id}`;
const TASKS = "**/api/v2/plugins/tasks*";

export function mockInstalledPlugins(page, plugins) {
  return page.route(INSTALLED, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.includes("marketplace")) return route.fallback();
    if (url.pathname.match(/\/plugins\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(plugins));
  });
}

export function mockPluginMarketplace(page, items) {
  return page.route(MARKETPLACE, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse(items));
  });
}

export function mockPluginDetail(page, plugin) {
  return page.route(PLUGIN_DETAIL(plugin.id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(plugin));
  });
}

// mockInstalledPlugins already falls back on any /plugins/<segment> path
// (including /plugins/tasks), so registration order relative to it doesn't
// matter — but register this one too, since PluginTasksList always calls
// pluginStore.getPlugins() on mount regardless of which page renders it.
export function mockPluginTasks(page, tasks) {
  return page.route(TASKS, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse(tasks));
  });
}
