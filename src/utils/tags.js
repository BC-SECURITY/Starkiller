import * as tagApi from "@/api/tag-api";

// Resolve a tag value to a tag id for attach-by-id. The tag picker passes a
// typed name (a raw STRING) for a brand-new tag; an object with an `id` (an
// already-known tag) resolves straight to its id. The per-entity attach endpoint
// takes a tag_id only, so a typed name is created in the global registry first;
// if it already exists (409 — e.g. another operator just created it, or a stale
// registry list) the existing tag is looked up and reused. Returns the tag id,
// or null for blank input.
export async function attachValueToTagId(value) {
  if (value && typeof value === "object") return value.id;

  const name = typeof value === "string" ? value.trim() : "";
  if (!name) return null;

  try {
    const tag = await tagApi.createTag({ name });
    return tag.id;
  } catch (error) {
    if (error?.response?.status === 409) {
      const { records } = await tagApi.getTags({
        page: 1,
        limit: -1,
        query: name,
      });
      // Case-insensitive exact match: the 409 means the name collided, and on
      // MySQL that collision is itself case-insensitive (e.g. "Prod" 409s
      // against an existing "prod"), so a case-sensitive `===` here would
      // never find the very row that caused the 409. Still an EXACT match
      // (not first-result) since `query` is a substring search and could
      // return other unrelated candidates (e.g. "production").
      const existing = records.find(
        (t) => t.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return existing.id;
    }
    throw error;
  }
}

// The tags currently attached to entities of `source` (one row per shared
// label — the registry is unique by name, so no client-side dedup is needed).
export async function fetchTags(source) {
  const { records } = await tagApi.getTags({
    page: 1,
    limit: -1,
    sources: source,
  });
  return records;
}

// The entire global tag registry, unfiltered.
export async function fetchAllTags() {
  const { records } = await tagApi.getTags({ page: 1, limit: -1 });
  return records;
}
