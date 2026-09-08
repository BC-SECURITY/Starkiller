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

// notLoadedPluginDetail: the boilerplate half of a plugin-detail response for
//   a plugin that failed to load, for spreading into a PluginEdit.vue fixture.
//   These fields are load-bearing rather than decorative — the three false
//   flags are what put the view on the Details tab (interactDisabled), and
//   PluginEdit's pluginDepsMessage/pluginDepsCommand both read
//   `python_deps.length` with no guard, so a caller MUST supply python_deps
//   (along with id/name) or the component throws during render and the
//   failure surfaces inside whatever the test was actually asserting.
export const notLoadedPluginDetail = {
  loaded: false,
  enabled: false,
  execution_enabled: false,
  authors: [],
  execution_options: {},
  settings_options: {},
};

export const defaultMarketplacePlugins = [
  {
    name: "marketplace-plugin",
    installed: false,
    installed_version: null,
    registries: {},
  },
];
