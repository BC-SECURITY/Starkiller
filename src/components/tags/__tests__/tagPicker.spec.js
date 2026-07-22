import { describe, it, expect } from "vitest";
import { filterTags, hasExactMatch } from "@/components/tags/tagPicker";

const registry = [
  { id: 1, name: "prod" },
  { id: 2, name: "prod-west" },
  { id: 3, name: "QA" },
];

describe("filterTags", () => {
  it("returns the whole registry for a blank or nullish query", () => {
    expect(filterTags(registry, "")).toEqual(registry);
    expect(filterTags(registry, "   ")).toEqual(registry);
    expect(filterTags(registry, null)).toEqual(registry);
  });

  it("matches by case-insensitive substring", () => {
    expect(filterTags(registry, "prod").map((t) => t.id)).toEqual([1, 2]);
    expect(filterTags(registry, "qa").map((t) => t.id)).toEqual([3]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterTags(registry, "zzz")).toEqual([]);
  });
});

describe("hasExactMatch", () => {
  it("is true for a case-insensitive, trimmed exact name", () => {
    expect(hasExactMatch(registry, "prod")).toBe(true);
    expect(hasExactMatch(registry, "  PROD ")).toBe(true);
    expect(hasExactMatch(registry, "qa")).toBe(true);
  });

  it("is false for a partial or absent name", () => {
    expect(hasExactMatch(registry, "pro")).toBe(false);
    expect(hasExactMatch(registry, "prod-e")).toBe(false);
    expect(hasExactMatch(registry, "new")).toBe(false);
  });

  it("is false for a blank or nullish query", () => {
    expect(hasExactMatch(registry, "")).toBe(false);
    expect(hasExactMatch(registry, null)).toBe(false);
  });
});
