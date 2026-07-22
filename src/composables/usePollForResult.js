import * as agentTaskApi from "@/api/agent-task-api";
import pause from "@/utils/pause";

// Task polling shared by AgentTerminal and AgentShellSession -- identical
// logic in both today (modulo trivial naming/comment differences). `agentRef`
// is a getter (`() => props.agent`), not a
// plain object, so the composable always reads the current prop value
// instead of closing over a stale snapshot taken when the composable is
// created.
export function usePollForResult(agentRef, { addLine, addInfo }) {
  async function checkTaskComplete(taskId) {
    try {
      const task = await agentTaskApi.getTask(agentRef().session_id, taskId);
      if (task.output) {
        return task;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function pollForResult(
    taskId,
    config = { print: true, attempts: 30, delay: 5000 },
  ) {
    if (!config.attempts) config.attempts = 30;
    config.delay = Math.max(
      config.delay ||
        (agentRef().delay != null ? agentRef().delay * 1000 : 5000),
      1000,
    );

    let res = null;
    let hasPrintedJobStarted = false;
    let i = 0;
    let complete = false;
    while (i < config.attempts) {
      // eslint-disable-next-line no-await-in-loop
      res = await checkTaskComplete(taskId);
      if (res) {
        const { output } = res;
        if (!output.toLowerCase().includes("job started")) {
          if (config.print) {
            const taskName = res.module_name || res.task_name || "shell";
            addLine(`[*] Task ${res.id} (${taskName}) completed`, "info-text");
            addLine(output, "indent-5-spaces");
          }
          complete = true;
          break;
        } else if (!hasPrintedJobStarted) {
          addLine(output, "indent-5-spaces");
          hasPrintedJobStarted = true;
        }
      }

      // eslint-disable-next-line no-await-in-loop
      await pause(config.delay);
      i++;
    }

    if (!complete) {
      addInfo(`No output received for task ${taskId}.`);
    }

    return res;
  }

  return { pollForResult, checkTaskComplete };
}
