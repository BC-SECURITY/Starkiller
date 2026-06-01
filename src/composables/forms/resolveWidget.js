// Pure, first-match-wins widget resolver. Returns `kind` (DynamicFormInput
// maps it to a Vuetify component via KIND_TO_COMPONENT) and `props` (forwarded
// via v-bind). The `file` and `cred` kinds are rendered via explicit template
// branches in DynamicFormInput, not the generic <component :is> path.
//
// Branch order is load-bearing — do not reorder without re-checking each
// invariant:
//   1. switch first, so True/False detection isn't shadowed by name-based
//      branches below.
//   2. Bypasses (name-based) wins over file/agent/cred, so a field literally
//      named "Bypasses" never accidentally routes to those special-cases.
//   3. file (type-based) wins over agent/cred (name-based) — a file upload
//      named "Agent" stays a file input.
//   4. has && !strict (combobox) precedes has && strict (select), matching
//      the legacy DynamicFormInput template.
//   5. text is the catch-all fallback.
export function resolveWidget({ name, type, strict, suggestedValues = [] }) {
  const has = suggestedValues.length > 0;

  if (
    has &&
    strict &&
    suggestedValues.includes("True") &&
    suggestedValues.includes("False")
  ) {
    return {
      kind: "switch",
      props: { color: "primary", "false-value": "False", "true-value": "True" },
    };
  }
  if (name === "Bypasses") {
    return {
      kind: "multiselect",
      props: { multiple: true, chips: true, variant: "outlined" },
    };
  }
  if (type === "file") {
    return { kind: "file", props: {} };
  }
  if (name === "Agent") {
    return {
      kind: "agent",
      props: {
        variant: "outlined",
        density: "compact",
        "item-value": "session_id",
        "item-title": "name",
      },
    };
  }
  if (name === "CredID") {
    return {
      kind: "cred",
      props: {
        variant: "outlined",
        density: "compact",
        "item-value": "id",
        "item-title": "id",
      },
    };
  }
  if (has && !strict) {
    return {
      kind: "combobox",
      props: { variant: "outlined", density: "compact" },
    };
  }
  if (has && strict) {
    return {
      kind: "select",
      props: { variant: "outlined", density: "compact" },
    };
  }
  return {
    kind: "text",
    props: {
      variant: "outlined",
      density: "compact",
      required: true,
      type: type === "string" ? "text" : "number",
    },
  };
}
