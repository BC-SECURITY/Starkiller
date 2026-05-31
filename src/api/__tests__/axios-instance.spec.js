import { handleError } from "@/api/axios-instance";

describe("handleError", () => {
  it("preserves response.status while exposing the FastAPI detail message", () => {
    // Regression guard: a {detail}-shaped 404 must stay introspectable via
    // err.response.status (AgentStats's 404-terminal branch) — returning a bare
    // string would strip it and make the status check silently fail forever.
    const axiosErr = {
      name: "AxiosError",
      response: { status: 404, data: { detail: "Agent not found" } },
    };
    const result = handleError(axiosErr);
    expect(result.response.status).toBe(404);
    expect(result.message).toBe("Agent not found");
  });

  it("stringifies to the bare detail (no 'Error:' prefix)", () => {
    // Keeps existing `${err}` / `Error: ${err}` interpolations rendering the
    // same as when handleError returned a plain string.
    const result = handleError({
      response: { status: 400, data: { detail: "Bad request" } },
    });
    expect(`${result}`).toBe("Bad request");
    expect(String(result)).toBe("Bad request");
  });

  it("returns the original error untouched when there is no detail body", () => {
    const networkErr = { name: "AxiosError", message: "Network Error" };
    expect(handleError(networkErr)).toBe(networkErr);
  });

  it("returns the original error when the response has a body but no detail", () => {
    // e.g. a 500 with a non-FastAPI body — status must stay introspectable.
    const err = { name: "AxiosError", response: { status: 500, data: {} } };
    const result = handleError(err);
    expect(result).toBe(err);
    expect(result.response.status).toBe(500);
  });
});
