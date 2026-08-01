// Vitest runs in node and can't parse Vuetify's per-component CSS imports.
// Mock the upstream module so kindToComponent loads here — the keep-in-sync
// invariant is structural (kinds line up), the actual component refs are
// covered by the e2e tests that mount real Vuetify.
vi.mock("vuetify/components", () => ({
  VAutocomplete: { name: "VAutocomplete" },
  VCombobox: { name: "VCombobox" },
  VSwitch: { name: "VSwitch" },
  VTextField: { name: "VTextField" },
}));

import { KIND_TO_COMPONENT } from "@/composables/forms/kindToComponent";
import { resolveWidget } from "@/composables/forms/resolveWidget";

// One representative input for every branch of resolveWidget. If a new branch
// is added without an entry here, the spec is incomplete; if an entry here
// produces a kind that isn't in KIND_TO_COMPONENT (and isn't file/cred), the
// renderer would silently mount nothing — the bug this map exists to prevent.
const RESOLVER_BRANCHES = [
  {
    name: "switch",
    args: {
      name: "Enabled",
      type: "boolean",
      strict: true,
      suggestedValues: ["True", "False"],
    },
  },
  {
    name: "multiselect (Bypasses)",
    args: {
      name: "Bypasses",
      type: "string",
      strict: false,
      suggestedValues: ["a"],
    },
  },
  {
    name: "file",
    args: { name: "x", type: "file", strict: false, suggestedValues: [] },
  },
  {
    name: "agent",
    args: { name: "Agent", type: "string", strict: false, suggestedValues: [] },
  },
  {
    name: "cred",
    args: {
      name: "CredID",
      type: "string",
      strict: false,
      suggestedValues: [],
    },
  },
  {
    name: "combobox",
    args: { name: "x", type: "string", strict: false, suggestedValues: ["a"] },
  },
  {
    name: "select",
    args: { name: "x", type: "string", strict: true, suggestedValues: ["a"] },
  },
  {
    name: "text",
    args: { name: "Name", type: "string", strict: false, suggestedValues: [] },
  },
];

const EXPLICIT_TEMPLATE_KINDS = ["file", "cred"];

describe("KIND_TO_COMPONENT", () => {
  it("has a component ref for every kind resolveWidget produces (except file/cred)", () => {
    for (const branch of RESOLVER_BRANCHES) {
      const { kind } = resolveWidget(branch.args);
      if (EXPLICIT_TEMPLATE_KINDS.includes(kind)) continue;
      expect(
        KIND_TO_COMPONENT[kind],
        `missing map entry for kind "${kind}" (${branch.name})`,
      ).toBeTruthy();
    }
  });

  it("only contains entries that some resolveWidget branch produces", () => {
    const producedKinds = new Set(
      RESOLVER_BRANCHES.map((b) => resolveWidget(b.args).kind),
    );
    for (const kind of Object.keys(KIND_TO_COMPONENT)) {
      expect(
        producedKinds.has(kind),
        `KIND_TO_COMPONENT has "${kind}" but no resolveWidget branch produces it`,
      ).toBe(true);
    }
  });
});
