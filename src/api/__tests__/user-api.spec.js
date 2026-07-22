import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the http wrapper so we can assert uploadAvatar() routes rejections
// through handleError like every other sibling export, instead of leaking
// the raw fetch/axios error.
const { request } = vi.hoisted(() => ({
  request: Object.assign(vi.fn(), { post: vi.fn() }),
}));
vi.mock("@/api/http", () => ({
  request,
  handleError: (e) => new Error(`handled: ${e.message}`),
}));

const { uploadAvatar } = await import("@/api/user-api");

beforeEach(() => {
  request.post.mockReset();
});

describe("user-api uploadAvatar", () => {
  it("rejects with the handleError-wrapped error on failure", async () => {
    request.post.mockRejectedValue(new Error("HTTP 422"));

    await expect(uploadAvatar(1, new FormData())).rejects.toThrow(
      "handled: HTTP 422",
    );
  });

  it("resolves normally on success", async () => {
    request.post.mockResolvedValue({ ok: true });

    await expect(uploadAvatar(1, new FormData())).resolves.toEqual({
      ok: true,
    });
  });
});
