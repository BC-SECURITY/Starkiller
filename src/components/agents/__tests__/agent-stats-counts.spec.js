import { deriveCounts } from "@/components/agents/agent-stats-counts";

const ok = (total) => ({ status: "fulfilled", value: { total } });
const rejected = (reason) => ({ status: "rejected", reason });

describe("deriveCounts", () => {
  it("returns total and queued when both legs succeed", () => {
    expect(deriveCounts(ok(42), ok(3))).toEqual({
      total: 42,
      queued: 3,
      queuedUnavailable: false,
    });
  });

  it("re-throws the total leg's reason verbatim (preserves response.status for the 404 path)", () => {
    const reason = Object.assign(new Error("Agent not found"), {
      response: { status: 404 },
    });
    let caught;
    try {
      deriveCounts(rejected(reason), ok(0));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBe(reason);
    expect(caught.response.status).toBe(404);
  });

  it("throws when the total response is fulfilled but has no numeric total", () => {
    expect(() =>
      deriveCounts({ status: "fulfilled", value: {} }, ok(0)),
    ).toThrow("Task API did not return a total count");
  });

  it("flags queuedUnavailable when the queued leg rejects", () => {
    expect(deriveCounts(ok(10), rejected(new Error("boom")))).toMatchObject({
      total: 10,
      queued: null,
      queuedUnavailable: true,
    });
  });

  it("flags queuedUnavailable when the queued leg is fulfilled but malformed", () => {
    // The subtle branch this PR introduced: a fulfilled-but-shapeless queued
    // response (no numeric total) must count as unavailable, not as zero.
    expect(
      deriveCounts(ok(10), { status: "fulfilled", value: {} }),
    ).toMatchObject({ total: 10, queued: null, queuedUnavailable: true });
  });

  it("treats a genuine zero queued count as available", () => {
    expect(deriveCounts(ok(10), ok(0))).toMatchObject({
      queued: 0,
      queuedUnavailable: false,
    });
  });
});
