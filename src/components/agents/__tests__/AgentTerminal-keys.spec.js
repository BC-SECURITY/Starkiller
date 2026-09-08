import { describe, it, expect, vi } from "vitest";
import AgentTerminal from "@/components/agents/AgentTerminal.vue";

// handleKeyEvents only reads and writes `this`, so it runs against a hand-rolled
// vm -- no mounting, which this repo can't do (environment: "node", no
// @vue/test-utils).
function pressKey(event, state = {}) {
  const vm = {
    currentInput: "",
    suggestions: [],
    currentSuggestionIndex: -1,
    generateSuggestions: vi.fn(),
    ...state,
  };
  AgentTerminal.methods.handleKeyEvents.call(vm, {
    preventDefault: vi.fn(),
    ...event,
  });
  return vm;
}

describe("AgentTerminal history storage key", () => {
  const keyFor = (vm) =>
    AgentTerminal.methods.historyStorageKey.call({
      ...vm,
      storageName: AgentTerminal.methods.storageName,
    });

  it("is namespaced per agent, and per tab when tabbed", () => {
    // TabbedTerminalContainer is this component's only render site and always
    // passes a tabId (first tab is 1), so tabId 1 is the real-world shape;
    // the null case is kept because storageName() still handles it.
    expect(keyFor({ agent: { session_id: "ABC12345" }, tabId: 1 })).toBe(
      "terminal-history-ABC12345-1:history",
    );
    expect(keyFor({ agent: { session_id: "ABC12345" }, tabId: 2 })).toBe(
      "terminal-history-ABC12345-2:history",
    );
    expect(keyFor({ agent: { session_id: "ABC12345" }, tabId: null })).toBe(
      "terminal-history-ABC12345:history",
    );
  });

  it("is null until the agent's session_id arrives", () => {
    expect(keyFor({ agent: {}, tabId: 1 })).toBeNull();
    expect(keyFor({ agent: {}, tabId: null })).toBeNull();
  });
});

describe("AgentTerminal Tab handling", () => {
  it("lets Shift+Tab move focus backwards instead of completing", () => {
    // event.code is the physical key, so Shift+Tab reaches the Tab branch.
    // Swallowing it leaves a keyboard-only operator no way out of the input
    // that mounted() focuses.
    const preventDefault = vi.fn();
    const vm = pressKey(
      { code: "Tab", shiftKey: true, preventDefault },
      { suggestions: ["ls", "ps"] },
    );
    expect(preventDefault).not.toHaveBeenCalled();
    expect(vm.generateSuggestions).not.toHaveBeenCalled();
    expect(vm.currentSuggestionIndex).toBe(-1);
  });

  it("still cycles suggestions on plain Tab", () => {
    const preventDefault = vi.fn();
    const vm = pressKey(
      { code: "Tab", preventDefault },
      { suggestions: ["ls", "ps"] },
    );
    expect(preventDefault).toHaveBeenCalled();
    expect(vm.currentSuggestionIndex).toBe(0);
  });

  it("asks for suggestions on Tab with an empty input", () => {
    // generateSuggestions early-returns with suggestions = [] on a falsy query,
    // so this only pins the delegation -- Tab on an empty input produces no
    // completions, which is why the next test matters.
    const vm = pressKey({ code: "Tab" }, { currentInput: "" });
    expect(vm.generateSuggestions).toHaveBeenCalled();
  });

  it("lets Tab move focus when there is nothing to complete", () => {
    // Same trap as the Shell tab: mounted() autofocuses this input and there is
    // no Escape or blur handler, so swallowing a Tab that does nothing leaves a
    // keyboard-only operator stuck.
    const emptyInput = vi.fn();
    pressKey(
      { code: "Tab", preventDefault: emptyInput },
      { currentInput: "", suggestions: [] },
    );
    expect(emptyInput).not.toHaveBeenCalled();

    const noMatches = vi.fn();
    pressKey(
      { code: "Tab", preventDefault: noMatches },
      { currentInput: "nonsense-xyz", suggestions: [] },
    );
    expect(noMatches).not.toHaveBeenCalled();
  });
});
