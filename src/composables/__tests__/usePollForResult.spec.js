const { getTask, pause } = vi.hoisted(() => ({
  getTask: vi.fn(),
  pause: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/api/agent-task-api", () => ({ getTask }));
vi.mock("@/utils/pause", () => ({ default: pause }));

const { usePollForResult } = await import("@/composables/usePollForResult");

describe("usePollForResult", () => {
  let addLine;
  let addInfo;
  let agent;

  beforeEach(() => {
    getTask.mockReset();
    pause.mockClear();
    addLine = vi.fn();
    addInfo = vi.fn();
    agent = { session_id: "AGENT1", delay: 0 };
  });

  it("resolves and prints output once the task completes", async () => {
    getTask.mockResolvedValueOnce({
      id: 7,
      output: "done",
      task_name: "shell",
    });
    const { pollForResult } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    const result = await pollForResult(7);

    expect(result.output).toBe("done");
    expect(addLine).toHaveBeenCalledWith(
      "[*] Task 7 (shell) completed",
      "info-text",
    );
    expect(addLine).toHaveBeenCalledWith("done", "indent-5-spaces");
    expect(addInfo).not.toHaveBeenCalled();
  });

  it("prints a 'job started' line only once while polling", async () => {
    getTask
      .mockResolvedValueOnce({ id: 7, output: "Job started: 7" })
      .mockResolvedValueOnce({ id: 7, output: "Job started: 7" })
      .mockResolvedValueOnce({ id: 7, output: "final", task_name: "shell" });
    const { pollForResult } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    await pollForResult(7, { print: true, attempts: 5, delay: 0 });

    const jobStartedCalls = addLine.mock.calls.filter(
      ([content]) => content === "Job started: 7",
    );
    expect(jobStartedCalls).toHaveLength(1);
  });

  it("reports no output received after exhausting attempts", async () => {
    getTask.mockResolvedValue({ id: 7, output: "" });
    const { pollForResult } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    const result = await pollForResult(7, {
      print: true,
      attempts: 2,
      delay: 0,
    });

    expect(result).toBe(false);
    expect(addInfo).toHaveBeenCalledWith("No output received for task 7.");
  });

  it("checkTaskComplete returns false when the API call rejects", async () => {
    getTask.mockRejectedValueOnce(new Error("network error"));
    const { checkTaskComplete } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    await expect(checkTaskComplete(7)).resolves.toBe(false);
  });

  it("does not print the completion lines when config.print is false", async () => {
    getTask.mockResolvedValueOnce({
      id: 7,
      output: "done",
      task_name: "shell",
    });
    const { pollForResult } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    await pollForResult(7, { print: false, attempts: 5, delay: 0 });

    expect(addLine).not.toHaveBeenCalledWith(
      "[*] Task 7 (shell) completed",
      "info-text",
    );
    expect(addLine).not.toHaveBeenCalledWith("done", "indent-5-spaces");
  });

  it("clamps a config.delay below 1000 up to the 1000ms floor", async () => {
    // A "job started" response first, so the loop actually reaches the
    // `await pause(config.delay)` call at least once before the final
    // response completes the task (an immediate completion on the first
    // attempt would `break` before ever calling pause).
    getTask
      .mockResolvedValueOnce({ id: 7, output: "Job started: 7" })
      .mockResolvedValueOnce({ id: 7, output: "final", task_name: "shell" });
    const { pollForResult } = usePollForResult(() => agent, {
      addLine,
      addInfo,
    });

    await pollForResult(7, { print: true, attempts: 5, delay: 10 });

    expect(pause).toHaveBeenCalledWith(1000);
  });
});
