import { describe, it, expect } from "vitest";
import AgentTerminal from "@/components/agents/AgentTerminal.vue";

// Guards the dropdown extraction without mounting (environment: node).
describe("AgentTerminal after dropdown extraction", () => {
  it("registers the shared TerminalSuggestions component", () => {
    expect(AgentTerminal.components.TerminalSuggestions).toBeDefined();
  });

  it("no longer defines positionSuggestions (moved into the child)", () => {
    expect(AgentTerminal.methods.positionSuggestions).toBeUndefined();
  });

  it("keeps its Empire suggestion generation", () => {
    expect(typeof AgentTerminal.methods.generateSuggestions).toBe("function");
  });

  it("keeps the currentInput watcher but drops the suggestions watcher", () => {
    expect(typeof AgentTerminal.watch.currentInput).toBe("function");
    expect(AgentTerminal.watch.suggestions).toBeUndefined();
  });
});
