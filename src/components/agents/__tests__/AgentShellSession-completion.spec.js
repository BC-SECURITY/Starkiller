import { describe, it, expect, vi } from "vitest";
import AgentShellSession from "@/components/agents/AgentShellSession.vue";

// handleKeyEvents is a plain options-object function that only reads and writes
// `this` -- no mounting needed, which matters because this repo runs Vitest with
// environment: "node" and has no @vue/test-utils.
function pressKey(event, state = {}) {
  const vm = {
    currentInput: "",
    commandHistory: [],
    suggestions: [],
    currentSuggestionIndex: -1,
    ...state,
  };
  AgentShellSession.methods.handleKeyEvents.call(vm, {
    preventDefault: vi.fn(),
    ...event,
  });
  return vm;
}

describe("AgentShellSession completion wiring", () => {
  it("registers the shared TerminalSuggestions component", () => {
    expect(AgentShellSession.components.TerminalSuggestions).toBeDefined();
  });

  it("has suggestion state in data", () => {
    const data = AgentShellSession.data();
    expect(data.suggestions).toEqual([]);
    expect(data.currentSuggestionIndex).toBe(-1);
  });

  it("exposes an applySuggestion method", () => {
    expect(typeof AgentShellSession.methods.applySuggestion).toBe("function");
  });
});

describe("AgentShellSession Tab completion", () => {
  it("lets Tab move focus when there is nothing to complete", () => {
    // Swallowing Tab unconditionally traps a keyboard-only operator: mounted()
    // focuses this input and the component has no Escape or blur handler.
    const preventDefault = vi.fn();
    pressKey({ code: "Tab", preventDefault }, { currentInput: "" });
    expect(preventDefault).not.toHaveBeenCalled();

    const noMatch = vi.fn();
    pressKey(
      { code: "Tab", preventDefault: noMatch },
      { currentInput: "xyz", commandHistory: ["whoami"] },
    );
    expect(noMatch).not.toHaveBeenCalled();
  });

  it("lets Shift+Tab move focus backwards even when matches exist", () => {
    const preventDefault = vi.fn();
    const vm = pressKey(
      { code: "Tab", shiftKey: true, preventDefault },
      { currentInput: "wh", commandHistory: ["whoami", "whoami /all"] },
    );
    expect(preventDefault).not.toHaveBeenCalled();
    expect(vm.suggestions).toEqual([]);
  });

  it("swallows Tab and completes when a single match exists", () => {
    const preventDefault = vi.fn();
    const vm = pressKey(
      { code: "Tab", preventDefault },
      { currentInput: "who", commandHistory: ["ps", "whoami"] },
    );
    expect(preventDefault).toHaveBeenCalled();
    expect(vm.currentInput).toBe("whoami");
    expect(vm.suggestions).toEqual([]);
  });

  it("cycles through multiple matches, wrapping at the end", () => {
    const state = {
      currentInput: "git ",
      commandHistory: ["git log", "git status"],
    };
    const first = pressKey({ code: "Tab" }, state);
    expect(first.suggestions).toEqual(["git status", "git log"]);
    expect(first.currentSuggestionIndex).toBe(0);

    const second = pressKey({ code: "Tab" }, { ...state, ...first });
    expect(second.currentSuggestionIndex).toBe(1);

    const wrapped = pressKey({ code: "Tab" }, { ...state, ...second });
    expect(wrapped.currentSuggestionIndex).toBe(0);
  });
});

describe("AgentShellSession history storage key", () => {
  const keyFor = (vm) =>
    AgentShellSession.methods.historyStorageKey.call({
      ...vm,
      storageName: AgentShellSession.methods.storageName,
    });

  it("is namespaced per agent, and per tab when tabbed", () => {
    expect(keyFor({ agent: { session_id: "ABC12345" }, tabId: null })).toBe(
      "shell-session-ABC12345:history",
    );
    expect(keyFor({ agent: { session_id: "ABC12345" }, tabId: 2 })).toBe(
      "shell-session-ABC12345-2:history",
    );
  });

  it("is null until the agent's session_id arrives", () => {
    // AgentEdit mounts this component before its getAgent() resolves, and
    // passes no tabId -- so an unguarded key is literally
    // "shell-session-undefined:history", shared by every agent.
    expect(keyFor({ agent: {}, tabId: null })).toBeNull();
    expect(keyFor({ agent: undefined, tabId: null })).toBeNull();
  });
});
