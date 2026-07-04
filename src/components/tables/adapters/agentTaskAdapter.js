// src/components/tables/adapters/agentTaskAdapter.js
import * as agentTaskApi from "@/api/agent-task-api";
import * as moduleApi from "@/api/module-api";

// Normalize a task's type to a lowercase, prefix-stripped key; the backend
// sends either "TASK_SHELL"/"TASK_SYSINFO" or "shell"/"sysinfo".
const taskKind = (item) =>
  (item.task_name || "").toLowerCase().replace(/^task_/, "");

export default {
  getTasks: (selected, opts) => agentTaskApi.getTasks(selected, opts),
  getTask: (id, taskId) => agentTaskApi.getTask(id, taskId),
  addTag: (id, taskId, tag) => agentTaskApi.addTag(id, taskId, tag),
  updateTag: (id, taskId, tag) => agentTaskApi.updateTag(id, taskId, tag),
  deleteTag: (id, taskId, tag) => agentTaskApi.deleteTag(id, taskId, tag),

  supportsRerun(item) {
    if (item.module_name) return true;
    return ["shell", "sysinfo"].includes(taskKind(item));
  },

  async rerunTask(task, { snack }) {
    try {
      const fullTask = await agentTaskApi.getTask(task.agent_id, task.id);
      if (fullTask.module_name) {
        const options = {
          ...(fullTask.options || {}),
          Agent: fullTask.agent_id,
        };
        await moduleApi.executeModule(fullTask.module_name, options);
        snack.info(`Module ${fullTask.module_name} rerun queued.`);
      } else if (taskKind(fullTask) === "shell") {
        await agentTaskApi.shell(fullTask.agent_id, fullTask.full_input);
        snack.info("Shell command rerun queued.");
      } else if (taskKind(fullTask) === "sysinfo") {
        await agentTaskApi.sysinfo(fullTask.agent_id);
        snack.info("Sysinfo task rerun queued.");
      } else {
        snack.error(
          `Rerunning ${fullTask.task_name || "this task"} is not supported.`,
        );
      }
    } catch (err) {
      snack.error(`Error rerunning task: ${err}`);
    }
  },

  async stopTask(task, { snack }) {
    try {
      await agentTaskApi.stopTask(task.agent_id, task.id);
      snack.success(`Task ${task.id} stop queued.`);
    } catch (err) {
      snack.error(`Error stopping task: ${err}`);
    }
  },
};
