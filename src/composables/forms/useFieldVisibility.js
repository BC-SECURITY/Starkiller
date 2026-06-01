import { ref, onBeforeUnmount, unref } from "vue";

// Pure: evaluate depends_on for every field against the current form values.
export function computeVisibility(allFields, form) {
  const visible = {};
  allFields.forEach((field) => {
    if (field.depends_on && Array.isArray(field.depends_on)) {
      visible[field.name] = field.depends_on.every((dep) => {
        // A malformed dep (null, or without a values array) can't be evaluated;
        // ignore it rather than throw and crash the whole form render at mount.
        // warnUnknownDependencies surfaces descriptor problems separately, and
        // ignoring (vs. hiding) keeps a needed field reachable on bad data.
        if (!dep || !Array.isArray(dep.values)) return true;
        return dep.values.includes(form[dep.name]);
      });
    } else {
      visible[field.name] = true;
    }
  });
  return visible;
}

// Callers drive updates explicitly via updateVisibility(formValue).
export function useFieldVisibility(allFields) {
  const visibleFields = ref({});
  const recentlyVisibleFields = ref([]);
  let flashTimer = null;
  // Track (field, missing-dep) pairs we've already warned about so depends_on
  // typos surface once at dev time without spamming the console on every
  // keystroke.
  const warnedMissingDeps = new Set();

  function isFieldVisible(field) {
    return visibleFields.value[field.name] !== false;
  }

  function highlight(fields) {
    recentlyVisibleFields.value = fields;
    // Keep fields flagged for 7s — well past the 1s CSS flash animation — so a
    // slow re-render still has a safe window to pick up the highlight class.
    // clearTimeout cancels any pending clear so a second transition doesn't
    // prematurely wipe a still-fresh highlight.
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      recentlyVisibleFields.value = [];
    }, 7000);
  }

  function warnUnknownDependencies(fields) {
    const knownNames = new Set(fields.map((f) => f.name));
    fields.forEach((field) => {
      if (!Array.isArray(field.depends_on)) return;
      field.depends_on.forEach((dep) => {
        if (!dep || typeof dep.name !== "string") return;
        if (knownNames.has(dep.name)) return;
        const key = `${field.name}::${dep.name}`;
        if (warnedMissingDeps.has(key)) return;
        warnedMissingDeps.add(key);
        console.warn(
          `[useFieldVisibility] Field "${field.name}" depends_on unknown field "${dep.name}" - it will always be hidden.`,
        );
      });
    });
  }

  // `initial` suppresses the flash on the first computation (form load).
  function updateVisibility(formValue, initial = false) {
    const fields = unref(allFields);
    warnUnknownDependencies(fields);
    const previous = visibleFields.value;
    const next = computeVisibility(fields, formValue);
    const keys = Object.keys(next);
    // Skip the write when visibility is unchanged — typing into a non-dependency
    // field shouldn't churn visibleFields and invalidate the requiredFields /
    // optionalFields / rules computeds that read it. The compare is the same
    // O(fields) cost the function already pays.
    const changed =
      keys.length !== Object.keys(previous).length ||
      keys.some((name) => next[name] !== previous[name]);
    if (!changed) return;
    const newlyVisible = keys.filter((name) => next[name] && !previous[name]);
    visibleFields.value = next;
    if (!initial && newlyVisible.length > 0) highlight(newlyVisible);
  }

  onBeforeUnmount(() => {
    if (flashTimer) clearTimeout(flashTimer);
  });

  return {
    visibleFields,
    isFieldVisible,
    recentlyVisibleFields,
    updateVisibility,
  };
}
