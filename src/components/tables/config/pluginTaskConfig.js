// src/components/tables/config/pluginTaskConfig.js
export default {
  idField: "plugin_id",
  routeName: "pluginEdit",
  inProgressStatus: "started",
  headerStoreKey: "pluginTaskHeaders",
  canStop: false,
  // Single source of truth for the columns. Column set and ordering
  // mirror agentTaskConfig (same `order` values for shared columns;
  // plugin_id takes agent_id's slot). Order 3 is agentTaskConfig's
  // Task Name, which plugin tasks don't have.
  columns: [
    {
      title: "",
      key: "data-table-expand",
      sortable: false,
      defaultHeader: true,
      alwaysShow: true,
      order: 0,
    },
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
      align: "center",
      order: 2,
    },
    {
      title: "Task Input",
      key: "input",
      sortable: false,
      defaultHeader: false,
      order: 4,
    },
    {
      title: "Plugin",
      key: "plugin_id",
      sortable: true,
      defaultHeader: true,
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
