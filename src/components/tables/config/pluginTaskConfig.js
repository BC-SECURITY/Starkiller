// src/components/tables/config/pluginTaskConfig.js
export default {
  idField: "plugin_id",
  routeName: "pluginEdit",
  inProgressStatus: "started",
  headerStoreKey: "pluginTaskHeaders",
  canStop: false,
  // Originally sourced from PluginTasksTable.vue's data().headersFull,
  // removed when it became a thin wrapper during the task-table
  // consolidation; this config is now the single source of truth for
  // the columns.
  columns: [
    {
      title: "Task ID",
      key: "id",
      sortable: true,
      defaultHeader: false,
      alwaysShow: false,
      align: "center",
      order: 1,
    },
    {
      title: "Status",
      key: "status",
      sortable: true,
      defaultHeader: true,
      order: 2,
    },
    {
      title: "Plugin",
      key: "plugin_id",
      sortable: true,
      defaultHeader: true,
      order: 3,
    },
    {
      title: "Task Input",
      key: "input",
      sortable: false,
      defaultHeader: false,
      order: 5,
    },
    {
      title: "User",
      key: "username",
      sortable: false,
      defaultHeader: true,
      order: 6,
    },
    {
      title: "Updated At",
      key: "updated_at",
      sortable: true,
      defaultHeader: true,
      order: 7,
    },
    {
      title: "Tags",
      key: "tags",
      sortable: false,
      width: 400,
      defaultHeader: true,
      order: 8,
    },
    {
      title: "Actions",
      key: "actions",
      sortable: false,
      defaultHeader: true,
      alwaysShow: true,
      order: 9,
    },
  ],
};
