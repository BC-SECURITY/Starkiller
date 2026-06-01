// Inbound (options -> form) and outbound (form -> emit) coercion. Single
// source of truth, replacing the old double-initialization. Nullish -> "".
export function buildInitialForm(allFields) {
  return allFields.reduce((map, field) => {
    if (field.name === "Bypasses") {
      if (Array.isArray(field.value)) {
        map[field.name] = field.value;
      } else {
        const raw = field.value == null ? "" : String(field.value);
        map[field.name] = raw
          .split(" ")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    } else {
      map[field.name] = field.value == null ? "" : field.value;
    }
    return map;
  }, {});
}

// Non-mutating: returns a new object. GeneralForm's deep `form` watcher calls
// this on every change, so it must not touch the reactive ref. Bypasses
// array -> space-joined string.
export function serializeForm(form) {
  const out = { ...form };
  if (Array.isArray(out.Bypasses)) {
    out.Bypasses = out.Bypasses.join(" ");
  }
  return out;
}

export function useFieldCoercion() {
  return { buildInitialForm, serializeForm };
}
