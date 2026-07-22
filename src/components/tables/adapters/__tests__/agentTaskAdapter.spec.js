import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/agent-task-api", () => ({
  getTask: vi.fn(),
  getTasks: vi.fn(),
  shell: vi.fn(),
  sysinfo: vi.fn(),
  stopTask: vi.fn(),
  addTag: vi.fn(),
  deleteTag: vi.fn(),
}));
vi.mock("@/api/module-api", () => ({ executeModule: vi.fn() }));

import * as agentTaskApi from "@/api/agent-task-api";
import * as moduleApi from "@/api/module-api";
import agentTaskAdapter from "@/components/tables/adapters/agentTaskAdapter";

const makeSnack = () => ({ info: vi.fn(), error: vi.fn(), success: vi.fn() });

describe("agentTaskAdapter.supportsRerun", () => {
  it("is true for module tasks and shell/sysinfo, false otherwise", () => {
    expect(agentTaskAdapter.supportsRerun({ module_name: "x" })).toBe(true);
    expect(agentTaskAdapter.supportsRerun({ task_name: "TASK_SHELL" })).toBe(
      true,
    );
    expect(agentTaskAdapter.supportsRerun({ task_name: "sysinfo" })).toBe(true);
    expect(agentTaskAdapter.supportsRerun({ task_name: "TASK_DOWNLOAD" })).toBe(
      false,
    );
  });
});

describe("agentTaskAdapter.rerunTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reruns a module task via executeModule with Agent injected", async () => {
    agentTaskApi.getTask.mockResolvedValue({
      agent_id: "A1",
      module_name: "mimikatz",
      options: { Foo: "bar" },
    });
    const snack = makeSnack();
    await agentTaskAdapter.rerunTask({ agent_id: "A1", id: 5 }, { snack });
    expect(moduleApi.executeModule).toHaveBeenCalledWith("mimikatz", {
      Foo: "bar",
      Agent: "A1",
    });
    expect(snack.info).toHaveBeenCalledWith("Module mimikatz rerun queued.");
  });

  it("reruns a shell task via shell(full_input)", async () => {
    agentTaskApi.getTask.mockResolvedValue({
      agent_id: "A1",
      task_name: "TASK_SHELL",
      full_input: "whoami",
    });
    const snack = makeSnack();
    await agentTaskAdapter.rerunTask({ agent_id: "A1", id: 5 }, { snack });
    expect(agentTaskApi.shell).toHaveBeenCalledWith("A1", "whoami");
    expect(snack.info).toHaveBeenCalledWith("Shell command rerun queued.");
  });

  it("reruns a sysinfo task via sysinfo", async () => {
    agentTaskApi.getTask.mockResolvedValue({
      agent_id: "A1",
      task_name: "TASK_SYSINFO",
    });
    const snack = makeSnack();
    await agentTaskAdapter.rerunTask({ agent_id: "A1", id: 5 }, { snack });
    expect(agentTaskApi.sysinfo).toHaveBeenCalledWith("A1");
    expect(snack.info).toHaveBeenCalledWith("Sysinfo task rerun queued.");
  });

  it("errors for an unsupported task", async () => {
    agentTaskApi.getTask.mockResolvedValue({
      agent_id: "A1",
      task_name: "TASK_DOWNLOAD",
    });
    const snack = makeSnack();
    await agentTaskAdapter.rerunTask({ agent_id: "A1", id: 5 }, { snack });
    expect(snack.error).toHaveBeenCalledWith(
      "Rerunning TASK_DOWNLOAD is not supported.",
    );
  });

  it("surfaces a getTask failure via the error snack", async () => {
    agentTaskApi.getTask.mockRejectedValue(new Error("boom"));
    const snack = makeSnack();
    await agentTaskAdapter.rerunTask({ agent_id: "A1", id: 5 }, { snack });
    expect(snack.error).toHaveBeenCalledWith(
      expect.stringContaining("Error rerunning task"),
    );
  });
});

describe("agentTaskAdapter passthroughs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getTasks forwards args to agentTaskApi.getTasks unchanged", () => {
    agentTaskApi.getTasks.mockReturnValue("tasks-result");
    const opts = { page: 1, limit: 10 };
    const result = agentTaskAdapter.getTasks(["A1", "A2"], opts);
    expect(agentTaskApi.getTasks).toHaveBeenCalledWith(["A1", "A2"], opts);
    expect(result).toBe("tasks-result");
  });

  it("getTask forwards args to agentTaskApi.getTask unchanged", () => {
    agentTaskApi.getTask.mockReturnValue("task-result");
    const result = agentTaskAdapter.getTask("A1", 5);
    expect(agentTaskApi.getTask).toHaveBeenCalledWith("A1", 5);
    expect(result).toBe("task-result");
  });

  it("addTag forwards args to agentTaskApi.addTag unchanged", () => {
    const tag = { name: "foo" };
    agentTaskApi.addTag.mockReturnValue("add-result");
    const result = agentTaskAdapter.addTag("A1", 5, tag);
    expect(agentTaskApi.addTag).toHaveBeenCalledWith("A1", 5, tag);
    expect(result).toBe("add-result");
  });

  it("deleteTag forwards args to agentTaskApi.deleteTag unchanged", () => {
    const tag = { id: 1 };
    agentTaskApi.deleteTag.mockReturnValue("delete-result");
    const result = agentTaskAdapter.deleteTag("A1", 5, tag);
    expect(agentTaskApi.deleteTag).toHaveBeenCalledWith("A1", 5, tag);
    expect(result).toBe("delete-result");
  });
});

describe("agentTaskAdapter.stopTask", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls stopTask and snacks success", async () => {
    agentTaskApi.stopTask.mockResolvedValue({});
    const snack = makeSnack();
    await agentTaskAdapter.stopTask({ agent_id: "A1", id: 9 }, { snack });
    expect(agentTaskApi.stopTask).toHaveBeenCalledWith("A1", 9);
    expect(snack.success).toHaveBeenCalledWith("Task 9 stop queued.");
  });

  it("surfaces a stopTask failure via the error snack", async () => {
    agentTaskApi.stopTask.mockRejectedValue(new Error("boom"));
    const snack = makeSnack();
    await agentTaskAdapter.stopTask({ agent_id: "A1", id: 9 }, { snack });
    expect(snack.error).toHaveBeenCalledWith(
      expect.stringContaining("Error stopping task"),
    );
  });
});
