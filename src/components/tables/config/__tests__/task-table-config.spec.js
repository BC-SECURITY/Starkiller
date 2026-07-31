import { describe, it, expect } from "vitest";
import agentTaskConfig from "@/components/tables/config/agentTaskConfig";
import pluginTaskConfig from "@/components/tables/config/pluginTaskConfig";
import agentTaskAdapter from "@/components/tables/adapters/agentTaskAdapter";
import pluginTaskAdapter from "@/components/tables/adapters/pluginTaskAdapter";

describe("agentTaskConfig", () => {
  it("targets agent identity, route, and the taskHeaders store key", () => {
    expect(agentTaskConfig.idField).toBe("agent_id");
    expect(agentTaskConfig.routeName).toBe("agentEdit");
    expect(agentTaskConfig.inProgressStatus).toBe("pulled");
    expect(agentTaskConfig.headerStoreKey).toBe("taskHeaders");
    expect(agentTaskConfig.canStop).toBe(true);
  });
  it("includes a Task Name column and an agent_id column", () => {
    const keys = agentTaskConfig.columns.map((c) => c.key);
    expect(keys).toContain("task_name");
    expect(keys).toContain("agent_id");
  });
  it("maintains exact rendered column order to guard against drift", () => {
    // TasksTable renders headersFull sorted by `order`, so assert the
    // sorted sequence — the raw array order is not what users see (and
    // in this config the two disagree: task_name renders before input).
    const keys = [...agentTaskConfig.columns]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.key);
    expect(keys).toEqual([
      "data-table-expand",
      "id",
      "status",
      "task_name",
      "input",
      "agent_id",
      "username",
      "updated_at",
      "tags",
      "actions",
    ]);
  });
  it("enforces distinguishing properties on drift-prone columns", () => {
    const statusCol = agentTaskConfig.columns.find((c) => c.key === "status");
    expect(statusCol.align).toBe("center");

    const expandCol = agentTaskConfig.columns.find(
      (c) => c.key === "data-table-expand",
    );
    expect(expandCol.alwaysShow).toBe(true);
    expect(expandCol.order).toBe(0);

    const tagsCol = agentTaskConfig.columns.find((c) => c.key === "tags");
    expect(tagsCol.width).toBe(400);
  });
});

describe("pluginTaskConfig", () => {
  it("targets plugin identity, route, and the pluginTaskHeaders store key", () => {
    expect(pluginTaskConfig.idField).toBe("plugin_id");
    expect(pluginTaskConfig.routeName).toBe("pluginEdit");
    expect(pluginTaskConfig.inProgressStatus).toBe("started");
    expect(pluginTaskConfig.headerStoreKey).toBe("pluginTaskHeaders");
    expect(pluginTaskConfig.canStop).toBe(false);
  });
  it("includes a plugin_id column and no task_name column", () => {
    const keys = pluginTaskConfig.columns.map((c) => c.key);
    expect(keys).toContain("plugin_id");
    expect(keys).not.toContain("task_name");
  });
  it("maintains exact rendered column order to guard against drift", () => {
    // TasksTable renders headersFull sorted by `order`, so assert the
    // sorted sequence rather than the raw array order.
    const keys = [...pluginTaskConfig.columns]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.key);
    expect(keys).toEqual([
      "data-table-expand",
      "id",
      "status",
      "input",
      "plugin_id",
      "username",
      "updated_at",
      "tags",
      "actions",
    ]);
  });
  it("pins the expand column as always visible", () => {
    // Load-bearing for the persisted-header model: alwaysShow columns
    // bypass the header store entirely and are never persisted.
    const expandCol = pluginTaskConfig.columns.find(
      (c) => c.key === "data-table-expand",
    );
    expect(expandCol.alwaysShow).toBe(true);
  });
  it("keeps display order aligned with agentTaskConfig for shared columns", () => {
    // The two tables should render shared columns in the same relative
    // positions (the entity column sits where agent_id sits). Shared keys
    // are derived as the intersection of the two configs so a future
    // shared column is covered automatically — as long as the
    // intersection stays non-empty, which the guard below pins so the
    // loop can't silently pass vacuously.
    const orderOf = (config, key) =>
      config.columns.find((c) => c.key === key).order;
    const agentKeys = new Set(agentTaskConfig.columns.map((c) => c.key));
    const sharedKeys = pluginTaskConfig.columns
      .map((c) => c.key)
      .filter((k) => agentKeys.has(k));
    expect(sharedKeys.length).toBeGreaterThan(0);
    for (const key of sharedKeys) {
      expect(orderOf(pluginTaskConfig, key)).toBe(
        orderOf(agentTaskConfig, key),
      );
    }
    expect(orderOf(pluginTaskConfig, "plugin_id")).toBe(
      orderOf(agentTaskConfig, "agent_id"),
    );
  });
});

describe("config.canStop / adapter.stopTask invariant", () => {
  // TasksTable.vue's stopTask() guards on `!this.adapter.stopTask` before
  // calling it, but the menu item that triggers it is also gated on
  // `config.canStop`. Both must agree, or a future config/adapter change
  // could silently drift into either a dead "Stop Task" menu item or a
  // reachable stopTask() with no adapter implementation.
  it("agent pair: canStop is true and adapter.stopTask is a function", () => {
    expect(agentTaskConfig.canStop).toBe(true);
    expect(typeof agentTaskAdapter.stopTask).toBe("function");
  });

  it("plugin pair: canStop is false and adapter.stopTask is undefined", () => {
    expect(pluginTaskConfig.canStop).toBe(false);
    expect(pluginTaskAdapter.stopTask).toBeUndefined();
  });
});
