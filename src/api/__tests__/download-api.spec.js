import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the http wrapper so we can assert createDownload() routes rejections
// through handleError like every other sibling export, instead of leaking
// the raw fetch/axios error.
const { request } = vi.hoisted(() => ({
  request: Object.assign(vi.fn(), { post: vi.fn() }),
}));
vi.mock("@/api/http", () => ({
  request,
  handleError: (e) => new Error(`handled: ${e.message}`),
}));

const { createDownload } = await import("@/api/download-api");

beforeEach(() => {
  request.post.mockReset();
});

describe("download-api createDownload", () => {
  it("rejects with the handleError-wrapped error on failure", async () => {
    request.post.mockRejectedValue(new Error("HTTP 422"));

    await expect(createDownload({ path: "/etc/passwd" })).rejects.toThrow(
      "handled: HTTP 422",
    );
  });

  it("resolves normally on success", async () => {
    request.post.mockResolvedValue({ id: 1 });

    await expect(createDownload({ path: "/etc/passwd" })).resolves.toEqual({
      id: 1,
    });
  });
});
