// src/components/tables/adapters/pluginTaskAdapter.js
import * as pluginApi from "@/api/plugin-api";

export default {
  getTasks: (selected, opts) => pluginApi.getTasks(selected, opts),
  getTask: (id, taskId) => pluginApi.getTask(id, taskId),
  addTag: (id, taskId, tag) => pluginApi.addTag(id, taskId, tag),
  updateTag: (id, taskId, tag) => pluginApi.updateTag(id, taskId, tag),
  deleteTag: (id, taskId, tag) => pluginApi.deleteTag(id, taskId, tag),

  supportsRerun: () => true,

  async rerunTask(task, { snack }) {
    try {
      const fullTask = await pluginApi.getTask(task.plugin_id, task.id);
      const options = fullTask.options || {};
      await pluginApi.executePlugin(fullTask.plugin_id, options);
      snack.info(`Plugin ${fullTask.plugin_id} rerun queued.`);
    } catch (err) {
      snack.error(`Error rerunning task: ${err}`);
    }
  },
  // No stopTask — plugin tasks cannot be stopped (config.canStop === false).
};
