import { describe, it, expect } from "vitest";
import { reconcileSelection } from "@/components/tables/filterSelection";

describe("reconcileSelection", () => {
  const items = [{ name: "prod" }, { name: "qa" }];

  it("keeps selected values whose item still exists", () => {
    expect(reconcileSelection(["prod", "qa"], items, "name")).toEqual([
      "prod",
      "qa",
    ]);
  });

  it("drops selected values whose item disappeared", () => {
    expect(reconcileSelection(["prod", "gone"], items, "name")).toEqual([
      "prod",
    ]);
  });

  it("returns empty when nothing still matches", () => {
    expect(reconcileSelection(["gone"], items, "name")).toEqual([]);
  });

  it("preserves the selection order", () => {
    expect(reconcileSelection(["qa", "prod"], items, "name")).toEqual([
      "qa",
      "prod",
    ]);
  });

  it("handles an empty selection", () => {
    expect(reconcileSelection([], items, "name")).toEqual([]);
  });

  it("handles an empty item list", () => {
    expect(reconcileSelection(["prod"], [], "name")).toEqual([]);
  });
});
