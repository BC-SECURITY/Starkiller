import { describe, it, expect, vi, beforeEach } from "vitest";
import AgentTerminal from "@/components/agents/AgentTerminal.vue";
import * as agentTaskApi from "@/api/agent-task-api";
import { BOX_BORDER } from "@/utils/ascii-table";

// These commands are thin wrappers over the agent task API (download, kill_date,
// working_hours, kill_job, history) and the agent store (kill, rename —
// which route through the store so local UI state stays in sync). Like the other
// specs in this dir, they run each method against a hand-rolled vm instead of
// mounting (environment: "node", no @vue/test-utils). The behavior under test is:
// the right call is made, and the terminal prints a success or error line (or a
// table) depending on how it settles.
vi.mock("@/api/agent-task-api");

const SESSION = "ABC12345";

function vm(overrides = {}) {
  return {
    agent: { session_id: SESSION },
    agentStore: {
      rename: vi.fn().mockResolvedValue({}),
      killAgent: vi.fn().mockResolvedValue({}),
    },
    tableConfig: { border: BOX_BORDER },
    addInfo: vi.fn(),
    addError: vi.fn(),
    displayTable: vi.fn(),
    ...overrides,
  };
}

const call = (method, self, ...args) =>
  AgentTerminal.methods[method].call(self, ...args);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AgentTerminal download command", () => {
  it("tasks the agent to download the given remote path", async () => {
    agentTaskApi.downloadFile.mockResolvedValue({});
    const self = vm();
    await call("taskDownload", self, "/etc/passwd");
    expect(agentTaskApi.downloadFile).toHaveBeenCalledWith(
      SESSION,
      "/etc/passwd",
    );
    expect(self.addInfo).toHaveBeenCalledWith(
      expect.stringContaining("/etc/passwd"),
    );
    expect(self.addError).not.toHaveBeenCalled();
  });

  it("reports an error when the path is missing", async () => {
    const self = vm();
    await call("taskDownload", self, "");
    expect(agentTaskApi.downloadFile).not.toHaveBeenCalled();
    expect(self.addError).toHaveBeenCalled();
  });

  it("reports an error when the API rejects", async () => {
    agentTaskApi.downloadFile.mockRejectedValue(new Error("boom"));
    const self = vm();
    await call("taskDownload", self, "/tmp/x");
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal kill_date command", () => {
  it("tasks the agent to update its kill date", async () => {
    agentTaskApi.updateKillDate.mockResolvedValue({});
    const self = vm();
    await call("taskKillDate", self, "01/01/2030");
    expect(agentTaskApi.updateKillDate).toHaveBeenCalledWith(
      SESSION,
      "01/01/2030",
    );
    expect(self.addInfo).toHaveBeenCalled();
  });

  it("reports an error when the date is missing", async () => {
    const self = vm();
    await call("taskKillDate", self, "");
    expect(agentTaskApi.updateKillDate).not.toHaveBeenCalled();
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal working_hours command", () => {
  it("tasks the agent to update its working hours", async () => {
    agentTaskApi.updateWorkingHours.mockResolvedValue({});
    const self = vm();
    await call("taskWorkingHours", self, "9:00-17:00");
    expect(agentTaskApi.updateWorkingHours).toHaveBeenCalledWith(
      SESSION,
      "9:00-17:00",
    );
    expect(self.addInfo).toHaveBeenCalled();
  });

  it("reports an error when the hours are missing", async () => {
    const self = vm();
    await call("taskWorkingHours", self, "");
    expect(agentTaskApi.updateWorkingHours).not.toHaveBeenCalled();
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal kill_job command", () => {
  it("tasks the agent to kill the given job id", async () => {
    agentTaskApi.killJob.mockResolvedValue({});
    const self = vm();
    await call("taskKillJob", self, "42");
    expect(agentTaskApi.killJob).toHaveBeenCalledWith(SESSION, "42");
    expect(self.addInfo).toHaveBeenCalled();
  });

  it("reports an error when the job id is missing", async () => {
    const self = vm();
    await call("taskKillJob", self, "");
    expect(agentTaskApi.killJob).not.toHaveBeenCalled();
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal kill command", () => {
  it("kills the agent through the store so local state stays in sync", async () => {
    const self = vm();
    await call("killThisAgent", self);
    expect(self.agentStore.killAgent).toHaveBeenCalledWith({
      sessionId: SESSION,
    });
    expect(self.addInfo).toHaveBeenCalled();
  });

  it("reports an error when the store call rejects", async () => {
    const self = vm({
      agentStore: {
        rename: vi.fn(),
        killAgent: vi.fn().mockRejectedValue(new Error("nope")),
      },
    });
    await call("killThisAgent", self);
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal rename command", () => {
  it("renames the agent through the store so local state stays in sync", async () => {
    const self = vm();
    await call("renameThisAgent", self, "beacon-1");
    expect(self.agentStore.rename).toHaveBeenCalledWith({
      sessionId: SESSION,
      newName: "beacon-1",
    });
    expect(self.addInfo).toHaveBeenCalled();
  });

  it("preserves spaces in the new name", async () => {
    const self = vm();
    await call("renameThisAgent", self, "my beacon");
    expect(self.agentStore.rename).toHaveBeenCalledWith({
      sessionId: SESSION,
      newName: "my beacon",
    });
  });

  it("reports an error when the new name is missing", async () => {
    const self = vm();
    await call("renameThisAgent", self, "");
    expect(self.agentStore.rename).not.toHaveBeenCalled();
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal history command", () => {
  it("fetches recent tasks with the default limit and renders a table with the rows", async () => {
    agentTaskApi.getTasks.mockResolvedValue({
      records: [{ id: 1, status: "completed", input: "whoami" }],
    });
    const self = vm();
    await call("taskHistory", self, undefined);
    expect(agentTaskApi.getTasks).toHaveBeenCalledWith(SESSION, { limit: 10 });
    // Assert the real rendered table (not just that displayTable fired) so the
    // table-building loop — headers, id/status/input cells — is exercised.
    const rendered = self.displayTable.mock.calls[0][0];
    expect(rendered).toContain("whoami");
    expect(rendered).toContain("completed");
  });

  it("honors an explicit count argument", async () => {
    agentTaskApi.getTasks.mockResolvedValue({ records: [] });
    const self = vm();
    await call("taskHistory", self, "5");
    expect(agentTaskApi.getTasks).toHaveBeenCalledWith(SESSION, { limit: 5 });
  });

  it("reports no history rather than an empty table", async () => {
    agentTaskApi.getTasks.mockResolvedValue({ records: [] });
    const self = vm();
    await call("taskHistory", self, undefined);
    expect(self.addInfo).toHaveBeenCalled();
    expect(self.displayTable).not.toHaveBeenCalled();
  });

  it("reports an error when the API rejects", async () => {
    agentTaskApi.getTasks.mockRejectedValue(new Error("boom"));
    const self = vm();
    await call("taskHistory", self, undefined);
    expect(self.addError).toHaveBeenCalled();
  });
});

describe("AgentTerminal command routing (processCommand)", () => {
  function dispatch(input, overrides = {}) {
    const self = {
      suggestions: [],
      currentSuggestionIndex: -1,
      currentInput: input,
      currentPrompt: "",
      currentModule: null,
      moduleOptions: {},
      addLine: vi.fn(),
      addError: vi.fn(),
      pushCommand: vi.fn(),
      taskDownload: vi.fn(),
      taskKillDate: vi.fn(),
      taskWorkingHours: vi.fn(),
      taskKillJob: vi.fn(),
      taskHistory: vi.fn(),
      killThisAgent: vi.fn(),
      renameThisAgent: vi.fn(),
      ...overrides,
    };
    AgentTerminal.methods.processCommand.call(self);
    return self;
  }

  it("routes 'download <path>' to taskDownload preserving spaces in the path", () => {
    const self = dispatch("download /tmp/my file.txt");
    expect(self.taskDownload).toHaveBeenCalledWith("/tmp/my file.txt");
    expect(self.addError).not.toHaveBeenCalled();
  });

  it("routes 'kill_date <date>' to taskKillDate", () => {
    const self = dispatch("kill_date 01/01/2030");
    expect(self.taskKillDate).toHaveBeenCalledWith("01/01/2030");
  });

  it("routes 'working_hours <hours>' to taskWorkingHours", () => {
    const self = dispatch("working_hours 9:00-17:00");
    expect(self.taskWorkingHours).toHaveBeenCalledWith("9:00-17:00");
  });

  it("routes 'kill_job <id>' to taskKillJob", () => {
    const self = dispatch("kill_job 7");
    expect(self.taskKillJob).toHaveBeenCalledWith("7");
  });

  it("routes 'history [count]' to taskHistory", () => {
    expect(dispatch("history 5").taskHistory).toHaveBeenCalledWith("5");
    expect(dispatch("history").taskHistory).toHaveBeenCalledWith(undefined);
  });

  it("routes 'kill' to killThisAgent (and 'exit' is not a kill alias)", () => {
    expect(dispatch("kill").killThisAgent).toHaveBeenCalled();
    expect(dispatch("exit").killThisAgent).not.toHaveBeenCalled();
  });

  it("routes 'rename <name>' to renameThisAgent preserving spaces", () => {
    const self = dispatch("rename my beacon");
    expect(self.renameThisAgent).toHaveBeenCalledWith("my beacon");
  });
});
