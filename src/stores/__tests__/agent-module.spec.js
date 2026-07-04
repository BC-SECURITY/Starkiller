import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useAgentStore } from "@/stores/agent-module";
import * as agentTaskApi from "@/api/agent-task-api";

// Mock agent-task-api so the store makes no real HTTP calls.
vi.mock("@/api/agent-task-api", () => ({
  deleteTask: vi.fn(),
}));

describe("agent-module store", () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("clearQueue", () => {
    // Regression test: clearQueue() used to fire per-task deletes with an
    // unawaited forEach and no return value, so a caller awaiting it would
    // resolve immediately regardless of whether the deletes succeeded —
    // awaiting the call site alone (without fixing this action) would have
    // been cosmetic.
    it("awaits every delete and returns a settled result per task", async () => {
      agentTaskApi.deleteTask.mockResolvedValue();
      const store = useAgentStore();

      const result = await store.clearQueue({
        sessionId: "abc",
        tasks: [1, 2, 3],
      });

      expect(agentTaskApi.deleteTask).toHaveBeenCalledTimes(3);
      expect(agentTaskApi.deleteTask).toHaveBeenCalledWith("abc", 1);
      expect(agentTaskApi.deleteTask).toHaveBeenCalledWith("abc", 2);
      expect(agentTaskApi.deleteTask).toHaveBeenCalledWith("abc", 3);
      expect(result.every((r) => r.status === "fulfilled")).toBe(true);
    });

    it("does not let one rejected delete stop or mask the others", async () => {
      agentTaskApi.deleteTask.mockImplementation((sessionId, taskId) =>
        taskId === 2 ? Promise.reject(new Error("boom")) : Promise.resolve(),
      );
      const store = useAgentStore();

      const result = await store.clearQueue({
        sessionId: "abc",
        tasks: [1, 2, 3],
      });

      expect(agentTaskApi.deleteTask).toHaveBeenCalledTimes(3);
      expect(result.map((r) => r.status)).toEqual([
        "fulfilled",
        "rejected",
        "fulfilled",
      ]);
    });
  });
});
