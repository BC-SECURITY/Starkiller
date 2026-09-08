import { attachValueToTagId, fetchAllTags, fetchTags } from "@/utils/tags";
import * as tagApi from "@/api/tag-api";

vi.mock("@/api/tag-api", () => ({ getTags: vi.fn(), createTag: vi.fn() }));

describe("attachValueToTagId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the id of a selected existing tag without creating one", async () => {
    expect(await attachValueToTagId({ id: 7, name: "prod" })).toBe(7);
    expect(tagApi.createTag).not.toHaveBeenCalled();
  });

  it("creates a typed (trimmed) new name and returns the new id", async () => {
    tagApi.createTag.mockResolvedValue({ id: 9, name: "new-tag" });
    expect(await attachValueToTagId("  new-tag  ")).toBe(9);
    expect(tagApi.createTag).toHaveBeenCalledWith({ name: "new-tag" });
  });

  it("reuses the existing tag (exact-name match) when create returns 409", async () => {
    tagApi.createTag.mockRejectedValue({ response: { status: 409 } });
    tagApi.getTags.mockResolvedValue({
      records: [
        { id: 4, name: "production" },
        { id: 3, name: "prod" },
      ],
    });
    expect(await attachValueToTagId("prod")).toBe(3);
    expect(tagApi.getTags).toHaveBeenCalledWith({
      page: 1,
      limit: -1,
      query: "prod",
    });
  });

  it("reuses the existing tag on a case-insensitive 409 (MySQL collation)", async () => {
    // MySQL's case-insensitive uniqueness means typing "Prod" 409s against an
    // existing "prod" row; the recovery lookup must match despite the case
    // difference, and still only the exact name (not "production").
    tagApi.createTag.mockRejectedValue({ response: { status: 409 } });
    tagApi.getTags.mockResolvedValue({
      records: [
        { id: 4, name: "production" },
        { id: 3, name: "prod" },
      ],
    });
    expect(await attachValueToTagId("Prod")).toBe(3);
  });

  it("rethrows the 409 when no exact-name match is found in the lookup", async () => {
    const error = { response: { status: 409 } };
    tagApi.createTag.mockRejectedValue(error);
    tagApi.getTags.mockResolvedValue({
      records: [{ id: 4, name: "production" }],
    });
    await expect(attachValueToTagId("prod")).rejects.toBe(error);
  });

  it("rethrows a non-409 create error", async () => {
    const error = { response: { status: 500 } };
    tagApi.createTag.mockRejectedValue(error);
    await expect(attachValueToTagId("boom")).rejects.toBe(error);
  });

  it("returns null for empty/blank input", async () => {
    expect(await attachValueToTagId("")).toBeNull();
    expect(await attachValueToTagId("   ")).toBeNull();
    expect(await attachValueToTagId(null)).toBeNull();
  });
});

describe("fetchTags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the full registry for the given source and returns records", async () => {
    tagApi.getTags.mockResolvedValue({ records: [{ id: 1, name: "env" }] });
    const result = await fetchTags("listener");
    expect(tagApi.getTags).toHaveBeenCalledWith({
      page: 1,
      limit: -1,
      sources: "listener",
    });
    expect(result).toEqual([{ id: 1, name: "env" }]);
  });

  it("returns an empty array when there are no records", async () => {
    tagApi.getTags.mockResolvedValue({ records: [] });
    expect(await fetchTags("agent")).toEqual([]);
  });
});

describe("fetchAllTags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the whole registry with no source filter", async () => {
    tagApi.getTags.mockResolvedValue({ records: [{ id: 1, name: "env" }] });
    const result = await fetchAllTags();
    expect(tagApi.getTags).toHaveBeenCalledWith({ page: 1, limit: -1 });
    expect(result).toEqual([{ id: 1, name: "env" }]);
  });
});
