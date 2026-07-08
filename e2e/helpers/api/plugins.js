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
import { jsonResponse, paginatedResponse } from "../responses.js";

const INSTALLED = "**/api/v2/plugins*";
const MARKETPLACE = "**/api/v2/plugin-registries/marketplace*";
const PLUGIN_DETAIL = (id) => `**/api/v2/plugins/${id}`;

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
