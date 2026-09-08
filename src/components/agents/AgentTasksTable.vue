<template>
  <tasks-table
    ref="tasksTable"
    :config="config"
    :adapter="adapter"
    :entity="agent"
    :selected-entities="selectedAgents"
    :refresh-tasks="refreshTasks"
    :hide-columns="hideColumns"
    :selected-users="selectedUsers"
    :selected-tags="selectedTags"
    :search="search"
    :no-filters="noFilters"
    @refresh-tags="$emit('refresh-tags')"
  />
</template>

<script>
import TasksTable from "@/components/tables/TasksTable.vue";
import agentTaskConfig from "@/components/tables/config/agentTaskConfig";
import agentTaskAdapter from "@/components/tables/adapters/agentTaskAdapter";

export default {
  name: "AgentTasksTable",
  components: { TasksTable },
  props: {
    agent: { type: Object, required: false, default: null },
    refreshTasks: { type: Boolean, default: false },
    hideColumns: { type: Array, default: () => [] },
    selectedAgents: { type: Array, default: () => [] },
    selectedUsers: { type: Array, default: () => [] },
    selectedTags: { type: Array, default: () => [] },
    search: { type: String, default: "" },
    noFilters: { type: Boolean, default: false },
  },
  emits: ["refresh-tags"],
  data() {
    return { config: agentTaskConfig, adapter: agentTaskAdapter };
  },
  methods: {
    // The list parents call this imperatively via $refs; Vue does not forward
    // a nested child's methods, so proxy it explicitly.
    debouncedGetTasks() {
      this.$refs.tasksTable.debouncedGetTasks();
    },
  },
};
</script>
