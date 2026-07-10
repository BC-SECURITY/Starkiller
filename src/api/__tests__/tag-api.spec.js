import { describe, it, expect, vi, beforeEach } from "vitest";

const { request } = vi.hoisted(() => {
  const fn = vi.fn();
  fn.post = vi.fn();
  fn.put = vi.fn();
  fn.delete = vi.fn();
  return { request: fn };
});
vi.mock("@/api/http", () => ({ request, handleError: (e) => e }));

const { createTag, updateTag, deleteTag } = await import("@/api/tag-api");

beforeEach(() => {
  request.post.mockReset();
  request.put.mockReset();
  request.delete.mockReset();
});

describe("tag-api registry CRUD", () => {
  it("createTag POSTs the label body", async () => {
    request.post.mockResolvedValue({ id: 4, name: "qa" });
    await expect(
      createTag({ name: "qa", color: "#fff", description: "d" }),
    ).resolves.toEqual({ id: 4, name: "qa" });
    expect(request.post).toHaveBeenCalledWith("/tags", {
      name: "qa",
      color: "#fff",
      description: "d",
    });
  });

  it("updateTag PUTs to the id with the patch body", async () => {
    request.put.mockResolvedValue({ id: 4, name: "qa2" });
    await expect(updateTag(4, { name: "qa2" })).resolves.toEqual({
      id: 4,
      name: "qa2",
    });
    expect(request.put).toHaveBeenCalledWith("/tags/4", { name: "qa2" });
  });

  it("deleteTag DELETEs the id", async () => {
    request.delete.mockResolvedValue(undefined);
    await expect(deleteTag(4)).resolves.toBe(undefined);
    expect(request.delete).toHaveBeenCalledWith("/tags/4");
  });

  it("createTag rejects with the handled error on 409", async () => {
    const err = { response: { status: 409 } };
    request.post.mockRejectedValue(err);
    await expect(createTag({ name: "dup" })).rejects.toBe(err);
  });
});
