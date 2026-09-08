import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the http wrapper so we can assert the exact request() arguments the
// migrated (axios -> fetch) functions build. vi.hoisted keeps the spy valid
// inside the hoisted vi.mock factory.
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/api/http", () => ({
  request,
  handleError: (e) => e,
}));

const { getProcesses, getCheckinsLast, getCheckinsAgg } = await import(
  "@/api/agent-api"
);

beforeEach(() => {
  request.mockReset();
});

describe("agent-api host/checkin queries", () => {
  it("getProcesses GETs the host processes and returns the records array", async () => {
    request.mockResolvedValue({ records: [{ pid: 1 }] });
    await expect(getProcesses("host-1")).resolves.toEqual([{ pid: 1 }]);
    expect(request).toHaveBeenCalledWith("/hosts/host-1/processes");
  });

  it("getCheckinsLast returns the first (most recent) record", async () => {
    request.mockResolvedValue({ records: [{ id: 9 }, { id: 8 }] });
    await expect(getCheckinsLast()).resolves.toEqual({ id: 9 });
    expect(request).toHaveBeenCalledWith("/agents/checkins/", {
      params: { limit: 1, order_direction: "desc" },
    });
  });

  it("getCheckinsAgg maps positional args to snake_case params and forwards the signal", async () => {
    request.mockResolvedValue({ buckets: [] });
    const controller = new AbortController();
    await getCheckinsAgg(
      "Day",
      "2026-01-01",
      "2026-02-01",
      "sess-1",
      controller.signal,
    );
    expect(request).toHaveBeenCalledWith("/agents/checkins/aggregate", {
      params: {
        bucket_size: "day",
        start_date: "2026-01-01",
        end_date: "2026-02-01",
        session_id: "sess-1",
      },
      signal: controller.signal,
    });
  });
});
