import { describe, it, expect } from "vitest";
import TerminalSuggestions from "@/components/agents/TerminalSuggestions.vue";

// No SFC mounting in this repo (environment: node, no @vue/test-utils).
// Inspect the component as an options object, mirroring
// src/components/tables/__tests__/task-table-wrappers.spec.js.
describe("TerminalSuggestions options surface", () => {
  it("declares the expected props", () => {
    expect(Object.keys(TerminalSuggestions.props)).toEqual(
      expect.arrayContaining(["suggestions", "highlightedIndex", "anchor"]),
    );
    expect(TerminalSuggestions.props.anchor.type).toBe(Function);
    expect(TerminalSuggestions.props.anchor.required).toBe(true);
  });

  it("emits select", () => {
    expect(TerminalSuggestions.emits).toContain("select");
  });

  it("watches suggestions and highlightedIndex with post-render flush", () => {
    expect(TerminalSuggestions.watch.suggestions.flush).toBe("post");
    expect(TerminalSuggestions.watch.highlightedIndex.flush).toBe("post");
  });

  it("exposes the DOM methods it owns", () => {
    expect(typeof TerminalSuggestions.methods.reposition).toBe("function");
    expect(typeof TerminalSuggestions.methods.scrollHighlightedIntoView).toBe(
      "function",
    );
  });
});
