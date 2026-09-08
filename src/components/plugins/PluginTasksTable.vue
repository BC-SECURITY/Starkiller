<template>
  <tasks-table
    ref="tasksTable"
    :config="config"
    :adapter="adapter"
    :entity="plugin"
    :selected-entities="selectedPlugins"
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
import pluginTaskConfig from "@/components/tables/config/pluginTaskConfig";
import pluginTaskAdapter from "@/components/tables/adapters/pluginTaskAdapter";

export default {
  name: "PluginTasksTable",
  components: { TasksTable },
  props: {
    plugin: { type: Object, required: false, default: null },
    refreshTasks: { type: Boolean, default: false },
    hideColumns: { type: Array, default: () => [] },
    selectedPlugins: { type: Array, default: () => [] },
    selectedUsers: { type: Array, default: () => [] },
    selectedTags: { type: Array, default: () => [] },
    search: { type: String, default: "" },
    noFilters: { type: Boolean, default: false },
  },
  emits: ["refresh-tags"],
  data() {
    return { config: pluginTaskConfig, adapter: pluginTaskAdapter };
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
