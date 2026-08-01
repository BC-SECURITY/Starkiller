// e2e/fixtures/plugins.js
//
// defaultInstalledPlugins: minimal shape required by PluginsList.vue,
//   which renders plugin.name inside a v-list-item-title.
//
// defaultMarketplacePlugins: minimal shape required by PluginMarketplace.vue.
//   The component renders plugin.name in v-list-item-title. The `registries`
//   field must be a non-null object (even empty) to avoid undefined errors in
//   the computed properties that call Object.keys(plugin.registries).
export const defaultInstalledPlugins = [
  {
    id: 1,
    name: "example-plugin",
    enabled: true,
    description: "Example plugin",
  },
];

export const defaultMarketplacePlugins = [
  {
    name: "marketplace-plugin",
    installed: false,
    installed_version: null,
    registries: {},
  },
];
