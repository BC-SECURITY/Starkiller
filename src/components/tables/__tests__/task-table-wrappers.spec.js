import { describe, it, expect, vi } from "vitest";

// Mock the heavy shared component so importing the wrappers stays light
// (no Vuetify/composable evaluation needed to inspect wrapper options).
vi.mock("@/components/tables/TasksTable.vue", () => ({
  default: { name: "TasksTable" },
}));

import AgentTasksTable from "@/components/agents/AgentTasksTable.vue";
import PluginTasksTable from "@/components/plugins/PluginTasksTable.vue";

describe("task-table wrappers preserve the imperative $refs surface", () => {
  it("AgentTasksTable exposes debouncedGetTasks() and re-emits refresh-tags", () => {
    expect(typeof AgentTasksTable.methods.debouncedGetTasks).toBe("function");
    expect(AgentTasksTable.emits).toContain("refresh-tags");
    expect(Object.keys(AgentTasksTable.props)).toEqual(
      expect.arrayContaining([
        "agent",
        "selectedAgents",
        "refreshTasks",
        "hideColumns",
        "selectedUsers",
        "selectedTags",
        "search",
        "noFilters",
      ]),
    );
  });

  it("PluginTasksTable exposes debouncedGetTasks() and re-emits refresh-tags", () => {
    expect(typeof PluginTasksTable.methods.debouncedGetTasks).toBe("function");
    expect(PluginTasksTable.emits).toContain("refresh-tags");
    expect(Object.keys(PluginTasksTable.props)).toEqual(
      expect.arrayContaining([
        "plugin",
        "selectedPlugins",
        "refreshTasks",
        "selectedUsers",
        "selectedTags",
        "search",
        "noFilters",
      ]),
    );
  });
});
