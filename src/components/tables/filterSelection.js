// Reconcile an active filter selection against a refreshed item list: keep only
// the selected values whose item still exists. This lets a filtered table
// refresh its options (e.g. after a tag is attached/detached) without silently
// discarding the operator's active filter — only values whose item genuinely
// disappeared are dropped.
export function reconcileSelection(selected, items, itemValue) {
  const values = new Set(items.map((item) => item[itemValue]));
  return selected.filter((value) => values.has(value));
}
