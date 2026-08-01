import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStore = { connectionError: 0, logout: vi.fn() };
vi.mock("@/stores/application-module", () => ({
  useApplicationStore: () => mockStore,
}));

// Imported after the mock is registered.
const { request, handleError, setInstance } = await import("@/api/http");

function mockFetch({
  ok = true,
  status = 200,
  statusText = "OK",
  body = "",
  headers = {},
} = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const res = {
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    text: vi.fn().mockResolvedValue(text),
    blob: vi.fn().mockResolvedValue(new Blob([text])),
  };
  global.fetch = vi.fn().mockResolvedValue(res);
  return res;
}

function lastUrl() {
  return global.fetch.mock.calls.at(-1)[0];
}

beforeEach(() => {
  mockStore.connectionError = 0;
  mockStore.logout.mockClear();
  setInstance("http://host:1337", "tok");
});

describe("request — success", () => {
  it("parses a JSON body and returns it directly", async () => {
    mockFetch({ body: { records: [1, 2] } });
    expect(await request("/agents")).toEqual({ records: [1, 2] });
  });

  it("injects baseURL + auth and normalizes leading-slash-free paths", async () => {
    mockFetch({ body: {} });
    await request("agents/1/tags/x", { method: "DELETE" });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("http://host:1337/api/v2/agents/1/tags/x");
    expect(opts.headers["X-Empire-Token"]).toBe("Bearer tok");
    expect(opts.method).toBe("DELETE");
  });

  it("resolves leading-slash and slash-free paths to the same URL", async () => {
    mockFetch({ body: {} });
    await request("/downloads");
    const withSlash = lastUrl();
    mockFetch({ body: {} });
    await request("downloads");
    expect(lastUrl()).toBe(withSlash);
  });

  it("returns undefined for an empty (204) body", async () => {
    mockFetch({ status: 204, body: "" });
    expect(
      await request("/credentials/1", { method: "DELETE" }),
    ).toBeUndefined();
  });

  it("throws on a non-empty malformed JSON 200 body so .then(d => d.records) never sees undefined", async () => {
    // A reverse-proxy 200-HTML page or truncated response would silently
    // become undefined under the old "always tolerate" behavior, then crash
    // a list consumer with TypeError. Throw an axios-shaped error so the
    // existing .catch(handleError) chain surfaces it.
    mockFetch({ status: 200, body: "<html>oops</html>" });
    const err = await request("/x").catch((e) => e);
    expect(err.response.status).toBe(200);
    expect(err.response.data).toBe("<html>oops</html>");
  });

  it("sends a JSON body with Content-Type for object data", async () => {
    mockFetch({ body: {} });
    await request("/x", { method: "POST", data: { a: 1 } });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("does NOT set Content-Type for FormData and passes it through", async () => {
    mockFetch({ body: {} });
    const fd = new FormData();
    fd.append("file", "x");
    await request("/downloads", { method: "POST", data: fd });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBeUndefined();
    expect(opts.body).toBe(fd);
  });

  it("returns a value whose .blob() and .headers.get() match the contract download-api uses", async () => {
    // download-api.js reads res.headers.get("content-type") /
    // get("content-disposition") and awaits res.blob() on the returned value.
    // Pin THAT contract, not just identity with the mock object.
    mockFetch({
      body: "binary",
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": 'attachment; filename="x.bin"',
      },
    });
    const res = await request("/downloads/1/download", {
      responseType: "blob",
    });
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="x.bin"',
    );
    const blob = await res.blob();
    expect(blob).toBeInstanceOf(Blob);
  });

  it("returns text for responseType text", async () => {
    mockFetch({ body: "hello" });
    expect(
      await request("/downloads/1/download", { responseType: "text" }),
    ).toBe("hello");
  });
});

describe("request — error contract", () => {
  it("throws an axios-shaped error on non-2xx", async () => {
    mockFetch({ ok: false, status: 422, body: { detail: "bad" } });
    await expect(request("/x")).rejects.toMatchObject({
      response: { status: 422, data: { detail: "bad" } },
    });
  });

  it("handleError unwraps detail synchronously", async () => {
    mockFetch({ ok: false, status: 422, body: { detail: "bad" } });
    const err = await request("/x").catch((e) => e);
    expect(handleError(err)).toBe("bad");
  });

  it("calls logout() on 401 and 403, not on other 4xx", async () => {
    mockFetch({ ok: false, status: 401, body: { detail: "no" } });
    await request("/x").catch(() => {});
    expect(mockStore.logout).toHaveBeenCalledTimes(1);

    mockStore.logout.mockClear();
    mockFetch({ ok: false, status: 403, body: {} });
    await request("/x").catch(() => {});
    expect(mockStore.logout).toHaveBeenCalledTimes(1);

    mockStore.logout.mockClear();
    mockFetch({ ok: false, status: 404, body: {} });
    await request("/x").catch(() => {});
    expect(mockStore.logout).not.toHaveBeenCalled();
  });

  it("bumps connectionError and rethrows on network failure (no logout)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("/x")).rejects.toBeInstanceOf(TypeError);
    expect(mockStore.connectionError).toBe(1);
    expect(mockStore.logout).not.toHaveBeenCalled();
  });

  it("tolerates a non-JSON error body (data undefined, no parse throw)", async () => {
    mockFetch({ ok: false, status: 500, body: "Internal Server Error" });
    const err = await request("/x").catch((e) => e);
    expect(err.response.status).toBe(500);
    expect(err.response.data).toBeUndefined();
  });
});

describe("toQuery serialization", () => {
  it("encodes spaces as %20 (not +)", async () => {
    mockFetch({ body: {} });
    await request("/tags", { params: { query: "foo bar" } });
    expect(lastUrl()).toContain("query=foo%20bar");
  });

  it("emits no query string when all params are null/undefined", async () => {
    mockFetch({ body: {} });
    await request("/x", { params: { a: null, b: undefined } });
    expect(lastUrl()).toBe("http://host:1337/api/v2/x");
  });

  it("serializes arrays as repeated keys and skips null/undefined items", async () => {
    mockFetch({ body: {} });
    await request("/downloads", {
      params: { tags: ["a", "b"], sources: [null, "x", undefined] },
    });
    const query = lastUrl().split("?")[1];
    expect(query).toContain("tags=a&tags=b");
    expect(query).toContain("sources=x");
    expect(query).not.toContain("null");
    expect(query).not.toContain("undefined");
  });

  it("keeps 0 / false / '' params (skipNulls drops only null/undefined)", async () => {
    // qs's `skipNulls: true` drops only null/undefined — 0/false/"" must stay
    // on the wire so a filter dropdown can send include_archived=false.
    mockFetch({ body: {} });
    await request("/x", { params: { a: 0, b: false, c: "" } });
    const query = lastUrl().split("?")[1];
    expect(query).toContain("a=0");
    expect(query).toContain("b=false");
    expect(query).toContain("c=");
  });
});

describe("headers", () => {
  it("merges caller-provided headers with the auth header", async () => {
    mockFetch({ body: {} });
    await request("/downloads/1/download", {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers["X-Empire-Token"]).toBe("Bearer tok");
    expect(opts.headers["Cache-Control"]).toBe("no-cache");
    expect(opts.headers.Pragma).toBe("no-cache");
  });

  it("overrides a caller-provided Content-Type for JSON bodies (wrapper-owned)", async () => {
    // Document current behavior: Content-Type is assigned AFTER the spread,
    // so the wrapper's "application/json" wins. Flag this if a future use
    // case needs caller-supplied content types.
    mockFetch({ body: {} });
    await request("/x", {
      method: "POST",
      data: { a: 1 },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });
});

describe("shorthand methods", () => {
  it("request.get delegates to GET", async () => {
    mockFetch({ body: { ok: 1 } });
    await request.get("/x");
    expect(global.fetch.mock.calls[0][1].method).toBe("GET");
  });

  it("request.post delegates to POST with data as the body", async () => {
    mockFetch({ body: {} });
    await request.post("/x", { a: 1 });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ a: 1 }));
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("request.post with no data sends no body and no Content-Type", async () => {
    mockFetch({ body: {} });
    await request.post("/bypasses/reload");
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeUndefined();
    expect(opts.headers["Content-Type"]).toBeUndefined();
  });

  it("request.put delegates to PUT with data as the body", async () => {
    mockFetch({ body: {} });
    await request.put("/x/1", { name: "n" });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.method).toBe("PUT");
    expect(opts.body).toBe(JSON.stringify({ name: "n" }));
  });

  it("request.delete delegates to DELETE with no body", async () => {
    mockFetch({ body: {} });
    await request.delete("/x/1");
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.method).toBe("DELETE");
    expect(opts.body).toBeUndefined();
  });

  it("shorthand passes opts.params through to the query string", async () => {
    mockFetch({ body: {} });
    await request.get("/x", { params: { q: "foo" } });
    expect(lastUrl()).toContain("?q=foo");
  });

  it("shorthand POST keeps FormData untouched (no Content-Type)", async () => {
    mockFetch({ body: {} });
    const fd = new FormData();
    fd.append("file", "x");
    await request.post("/downloads", fd);
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBeUndefined();
    expect(opts.body).toBe(fd);
  });
});
