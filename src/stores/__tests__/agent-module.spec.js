import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { useAgentStore } from "@/stores/agent-module";
import * as agentApi from "@/api/agent-api";
import * as agentTaskApi from "@/api/agent-task-api";

// Mock the agent-api so the store makes no real HTTP calls.
vi.mock("@/api/agent-api", () => ({
  getAgent: vi.fn(),
  getAgents: vi.fn(),
  renameAgent: vi.fn(),
  killAgent: vi.fn(),
}));

// Mock agent-task-api so the store makes no real HTTP calls.
vi.mock("@/api/agent-task-api", () => ({
  deleteTask: vi.fn(),
}));

describe("agent-module store", () => {
  beforeEach(() => {
    // stubActions:false so the real action logic under test actually runs
    // (rename()'s not-yet-cached branch calls this.getAgents(), which in
    // turn reads the real application store's autoSubscribeAgents default).
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    );
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rename", () => {
    it("renames an agent already present in the cached list", async () => {
      const store = useAgentStore();
      store.agents = [{ session_id: "abc", name: "old-name" }];
      agentApi.renameAgent.mockResolvedValue();

      const result = await store.rename({
        sessionId: "abc",
        newName: "new-name",
      });

      expect(agentApi.renameAgent).toHaveBeenCalledWith(
        { session_id: "abc", name: "new-name" },
        "new-name",
      );
      expect(result).toBe("new-name");
      expect(store.agents[0].name).toBe("new-name");
    });

    // Regression test for a stale-index bug: renameAgent() used to compute
    // agentIndex via findIndex() BEFORE the refetch, then reuse that same
    // (still -1) index to read from the refreshed array, crashing with
    // "Cannot read properties of undefined (reading 'session_id')".
    //
    // The realistic trigger isn't "any page refresh" (the store persists
    // across reloads) — it's an agent that checked in after this browser's
    // cached/persisted agent list was last refreshed, e.g. reached via a
    // direct link to /agents/:id before the Agents list page repopulated
    // the store.
    it("refetches and renames an agent missing from the cached list", async () => {
      const store = useAgentStore();
      store.agents = [{ session_id: "other", name: "unrelated" }];
      agentApi.getAgents.mockResolvedValue([
        { session_id: "other", name: "unrelated" },
        { session_id: "new-checkin", name: "old-name" },
      ]);
      agentApi.renameAgent.mockResolvedValue();

      const result = await store.rename({
        sessionId: "new-checkin",
        newName: "new-name",
      });

      expect(agentApi.getAgents).toHaveBeenCalledTimes(1);
      expect(agentApi.renameAgent).toHaveBeenCalledWith(
        { session_id: "new-checkin", name: "new-name" },
        "new-name",
      );
      expect(result).toBe("new-name");
      expect(
        store.agents.find((a) => a.session_id === "new-checkin").name,
      ).toBe("new-name");
    });

    it("still throws when the agent does not exist even after refetch", async () => {
      const store = useAgentStore();
      store.agents = [];
      agentApi.getAgents.mockResolvedValue([]);
      // Mirrors the real agent-api.js renameAgent(), which dereferences
      // agent.session_id and throws synchronously when agent is undefined.
      // This case is unchanged by the stale-index fix and is not a
      // regression: the caller (AgentForm.updateName) already catches it
      // and shows an error toast rather than a false "success".
      agentApi.renameAgent.mockImplementation((agent) =>
        Promise.resolve(agent.session_id),
      );

      await expect(
        store.rename({ sessionId: "ghost", newName: "new-name" }),
      ).rejects.toThrow();
    });
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
