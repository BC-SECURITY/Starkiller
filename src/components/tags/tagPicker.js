// Pure list helpers for the tag picker dialog.

// Tags whose name contains `query` (case-insensitive substring). A blank or
// nullish query returns the whole registry unchanged.
export function filterTags(registry, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return registry;
  return registry.filter((tag) => tag.name.toLowerCase().includes(q));
}

// Whether `query` exactly equals an existing tag name (case-insensitive,
// trimmed). Drives whether the "Create '<query>'" row is offered.
export function hasExactMatch(registry, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return false;
  return registry.some((tag) => tag.name.toLowerCase() === q);
}
