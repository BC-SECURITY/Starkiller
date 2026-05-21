import { fetchDedupedTags } from "@/utils/tags";
import * as tagApi from "@/api/tag-api";

vi.mock("@/api/tag-api", () => ({
  getTags: vi.fn(),
}));

describe("fetchDedupedTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests all tags for the given source", async () => {
    tagApi.getTags.mockResolvedValue({ records: [] });
    await fetchDedupedTags("listener");
    expect(tagApi.getTags).toHaveBeenCalledWith({
      page: 1,
      limit: -1,
      sources: "listener",
    });
  });

  // Distinct name OR distinct value counts as a different tag; only an exact
  // (name, value) match is treated as a duplicate.
  it("dedups tags sharing the same name AND value, keeping the first", async () => {
    tagApi.getTags.mockResolvedValue({
      records: [
        { name: "env", value: "prod" },
        { name: "env", value: "prod" }, // exact dup — dropped
        { name: "env", value: "dev" }, // same name, different value — kept
        { name: "team", value: "prod" }, // different name, same value — kept
      ],
    });
    const result = await fetchDedupedTags("agent");
    expect(result).toEqual([
      { name: "env", value: "prod" },
      { name: "env", value: "dev" },
      { name: "team", value: "prod" },
    ]);
  });

  it("returns an empty array when there are no records", async () => {
    tagApi.getTags.mockResolvedValue({ records: [] });
    expect(await fetchDedupedTags("agent")).toEqual([]);
  });
});
