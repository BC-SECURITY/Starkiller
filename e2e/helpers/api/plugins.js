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
import { paginatedResponse } from "../responses.js";

const INSTALLED = "**/api/v2/plugins*";
const MARKETPLACE = "**/api/v2/plugin-registries/marketplace*";

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
