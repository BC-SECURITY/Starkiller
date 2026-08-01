import {
  VAutocomplete,
  VCombobox,
  VSwitch,
  VTextField,
} from "vuetify/components";

// Maps widget kinds (from resolveWidget) to imported Vuetify component refs
// for DynamicFormInput's generic <component :is> path. The `file` and `cred`
// kinds have dedicated template branches and are NOT in this map.
//
// vite-plugin-vuetify's autoImport resolves literal template tags
// (<v-text-field>) but not string-based <component :is="'v-text-field'">,
// so a component ref is required, not a string. If a new kind is added in
// resolveWidget, add it here too AND add a representative entry to
// RESOLVER_BRANCHES in kindToComponent.spec.js — the spec keeps
// RESOLVER_BRANCHES and KIND_TO_COMPONENT in sync with each other but it
// does NOT introspect resolveWidget itself, so a new resolver branch with
// no fixture in RESOLVER_BRANCHES will still pass both tests silently.
export const KIND_TO_COMPONENT = {
  text: VTextField,
  multiselect: VAutocomplete,
  agent: VAutocomplete,
  combobox: VCombobox,
  select: VAutocomplete,
  switch: VSwitch,
};
