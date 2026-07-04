import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/plugin-api", () => ({
  getTask: vi.fn(),
  getTasks: vi.fn(),
  executePlugin: vi.fn(),
  addTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}));

import * as pluginApi from "@/api/plugin-api";
import pluginTaskAdapter from "@/components/tables/adapters/pluginTaskAdapter";

const makeSnack = () => ({ info: vi.fn(), error: vi.fn(), success: vi.fn() });

describe("pluginTaskAdapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supportsRerun is always true", () => {
    expect(pluginTaskAdapter.supportsRerun({})).toBe(true);
  });

  it("rerun executes the plugin with its options", async () => {
    pluginApi.getTask.mockResolvedValue({ plugin_id: "P1", options: { X: 1 } });
    const snack = makeSnack();
    await pluginTaskAdapter.rerunTask({ plugin_id: "P1", id: 2 }, { snack });
    expect(pluginApi.executePlugin).toHaveBeenCalledWith("P1", { X: 1 });
    expect(snack.info).toHaveBeenCalledWith("Plugin P1 rerun queued.");
  });

  it("surfaces a getTask failure via the error snack", async () => {
    pluginApi.getTask.mockRejectedValue(new Error("boom"));
    const snack = makeSnack();
    await pluginTaskAdapter.rerunTask({ plugin_id: "P1", id: 2 }, { snack });
    expect(snack.error).toHaveBeenCalledWith(
      expect.stringContaining("Error rerunning task"),
    );
  });

  it("does not expose stopTask", () => {
    expect(pluginTaskAdapter.stopTask).toBeUndefined();
  });

  it("getTasks forwards args to pluginApi.getTasks unchanged", () => {
    pluginApi.getTasks.mockReturnValue("tasks-result");
    const opts = { page: 1, limit: 10 };
    const result = pluginTaskAdapter.getTasks(["P1", "P2"], opts);
    expect(pluginApi.getTasks).toHaveBeenCalledWith(["P1", "P2"], opts);
    expect(result).toBe("tasks-result");
  });

  it("getTask forwards args to pluginApi.getTask unchanged", () => {
    pluginApi.getTask.mockReturnValue("task-result");
    const result = pluginTaskAdapter.getTask("P1", 2);
    expect(pluginApi.getTask).toHaveBeenCalledWith("P1", 2);
    expect(result).toBe("task-result");
  });

  it("addTag forwards args to pluginApi.addTag unchanged", () => {
    const tag = { name: "foo" };
    pluginApi.addTag.mockReturnValue("add-result");
    const result = pluginTaskAdapter.addTag("P1", 2, tag);
    expect(pluginApi.addTag).toHaveBeenCalledWith("P1", 2, tag);
    expect(result).toBe("add-result");
  });

  it("updateTag forwards args to pluginApi.updateTag unchanged", () => {
    const tag = { id: 1, name: "foo" };
    pluginApi.updateTag.mockReturnValue("update-result");
    const result = pluginTaskAdapter.updateTag("P1", 2, tag);
    expect(pluginApi.updateTag).toHaveBeenCalledWith("P1", 2, tag);
    expect(pluginApi.deleteTag).not.toHaveBeenCalled();
    expect(result).toBe("update-result");
  });

  it("deleteTag forwards args to pluginApi.deleteTag unchanged", () => {
    const tag = { id: 1 };
    pluginApi.deleteTag.mockReturnValue("delete-result");
    const result = pluginTaskAdapter.deleteTag("P1", 2, tag);
    expect(pluginApi.deleteTag).toHaveBeenCalledWith("P1", 2, tag);
    expect(pluginApi.updateTag).not.toHaveBeenCalled();
    expect(result).toBe("delete-result");
  });
});
