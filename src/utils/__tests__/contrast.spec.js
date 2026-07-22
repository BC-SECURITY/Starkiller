import { describe, it, expect } from "vitest";
import { readableTextColor } from "@/utils/contrast";

describe("readableTextColor", () => {
  it("returns white for dark backgrounds", () => {
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#2196F3")).toBe("#ffffff"); // material blue default
  });

  it("returns black for light backgrounds", () => {
    expect(readableTextColor("#ffffff")).toBe("#000000");
    expect(readableTextColor("#FFEB3B")).toBe("#000000"); // yellow
    expect(readableTextColor("#E0E0E0")).toBe("#000000"); // light grey
  });

  it("expands 3-digit shorthand hex", () => {
    expect(readableTextColor("#000")).toBe("#ffffff");
    expect(readableTextColor("#fff")).toBe("#000000");
  });

  it("ignores a trailing alpha channel (8-digit hexa)", () => {
    expect(readableTextColor("#000000ff")).toBe("#ffffff");
    expect(readableTextColor("#ffffffcc")).toBe("#000000");
  });

  it("defaults to white for missing or unparseable colors", () => {
    expect(readableTextColor(null)).toBe("#ffffff");
    expect(readableTextColor(undefined)).toBe("#ffffff");
    expect(readableTextColor("")).toBe("#ffffff");
    expect(readableTextColor("primary")).toBe("#ffffff");
  });
});
