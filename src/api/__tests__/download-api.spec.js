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

const { createDownload, getFilename } = await import("@/api/download-api");

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

describe("download-api getFilename", () => {
  it("returns 'download' when there is no header at all", () => {
    expect(getFilename(undefined)).toBe("download");
    expect(getFilename("")).toBe("download");
  });

  it("returns 'download' when the header has no filename= parameter", () => {
    expect(getFilename("attachment")).toBe("download");
  });

  it("parses a plain quoted filename", () => {
    expect(getFilename('attachment; filename="report.csv"')).toBe("report.csv");
  });

  // Regression test: RFC 6266 allows further parameters after filename=
  // (size, charset, ...) -- the old parser only stripped a quote character
  // sitting at the very start/end of the whole remaining string, so a
  // trailing parameter left a mangled `report.csv"; size=123`.
  it("isolates the filename value from trailing parameters (regression)", () => {
    expect(getFilename('attachment; filename="report.csv"; size=123')).toBe(
      "report.csv",
    );
  });

  it("parses an RFC 5987 filename*=UTF-8''... value", () => {
    expect(getFilename("attachment; filename*=UTF-8''report.csv")).toBe(
      "report.csv",
    );
  });

  it("decodes percent-encoded characters in an RFC 5987 value", () => {
    expect(getFilename("attachment; filename*=UTF-8''report%20final.csv")).toBe(
      "report final.csv",
    );
  });

  // Regression test: a malformed/missing second `'` delimiter in the
  // filename*= form used to yield decodeURIComponent(undefined), which
  // coerces to the literal string "undefined" instead of a real fallback.
  it("falls back to 'download' on a malformed filename*= value", () => {
    expect(getFilename("attachment; filename*=UTF-8report.csv")).toBe(
      "download",
    );
  });
});
