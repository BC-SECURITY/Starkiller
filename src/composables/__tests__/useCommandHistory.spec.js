import {
  useCommandHistory,
  historyMatches,
} from "@/composables/useCommandHistory";

function createFakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

// Several tests install a fake localStorage on the global. Drop it between
// tests so the file can't become order-dependent on whichever fake ran last.
afterEach(() => {
  delete global.localStorage;
});

describe("useCommandHistory", () => {
  it("pushCommand appends and resets the index past the end", () => {
    const { commandHistory, historyIndex, pushCommand } = useCommandHistory();
    pushCommand("whoami");
    expect(commandHistory.value).toEqual(["whoami"]);
    expect(historyIndex.value).toBe(1);
    pushCommand("ps");
    expect(commandHistory.value).toEqual(["whoami", "ps"]);
    expect(historyIndex.value).toBe(2);
  });

  it("pushCommand skips a command identical to the previous one", () => {
    const { commandHistory, pushCommand } = useCommandHistory();
    pushCommand("ls");
    pushCommand("ls");
    expect(commandHistory.value).toEqual(["ls"]);
    pushCommand("pwd");
    pushCommand("ls");
    expect(commandHistory.value).toEqual(["ls", "pwd", "ls"]);
  });

  it("pushCommand caps history at 200 entries, dropping the oldest", () => {
    const { commandHistory, pushCommand } = useCommandHistory();
    for (let i = 0; i < 250; i++) pushCommand(`cmd-${i}`);
    expect(commandHistory.value).toHaveLength(200);
    expect(commandHistory.value[0]).toBe("cmd-50");
    expect(commandHistory.value[199]).toBe("cmd-249");
  });

  it("navigatePrev returns undefined when history is empty", () => {
    const { navigatePrev } = useCommandHistory();
    expect(navigatePrev()).toBeUndefined();
  });

  it("navigatePrev walks toward older entries and stops at the oldest", () => {
    const { pushCommand, navigatePrev, historyIndex } = useCommandHistory();
    pushCommand("whoami");
    pushCommand("ps");
    expect(navigatePrev()).toBe("ps");
    expect(navigatePrev()).toBe("whoami");
    expect(navigatePrev()).toBeUndefined();
    expect(historyIndex.value).toBe(0);
  });

  it("navigateNext past the newest restores the stashed draft and sits at the bottom", () => {
    const { pushCommand, navigatePrev, navigateNext, historyIndex } =
      useCommandHistory();
    pushCommand("whoami");
    pushCommand("ps");
    // Start navigating up WITH a real draft so the restored value is
    // distinguishable from the at-bottom `undefined`.
    expect(navigatePrev("half-typed")).toBe("ps");
    expect(navigateNext()).toBe("half-typed");
    expect(historyIndex.value).toBe(2); // == commandHistory.length (bottom)
  });

  it("navigateNext restores an empty-string draft (distinct from undefined)", () => {
    const { pushCommand, navigatePrev, navigateNext } = useCommandHistory();
    pushCommand("a");
    expect(navigatePrev("")).toBe("a");
    expect(navigateNext()).toBe("");
  });

  it("navigateNext returns undefined when already at the bottom", () => {
    const { navigateNext } = useCommandHistory();
    expect(navigateNext()).toBeUndefined();
  });

  it("persists on push and reloads in a fresh instance", () => {
    const storage = createFakeStorage();
    global.localStorage = storage;
    const key = () => "shell-session-abc:history";

    const a = useCommandHistory(key);
    a.pushCommand("whoami");
    a.pushCommand("ps");

    const b = useCommandHistory(key);
    b.loadCommandHistory();
    expect(b.commandHistory.value).toEqual(["whoami", "ps"]);
  });

  it("never touches storage while the key getter returns null", () => {
    // AgentShellSession can mount before its agent's session_id arrives. Until
    // it does there is no per-agent key, only a shared one -- reading it would
    // surface another agent's commands, and writing would leak this agent's.
    const getItem = vi.fn(() => '["someone-elses-command"]');
    const setItem = vi.fn();
    global.localStorage = { getItem, setItem, removeItem: () => {} };

    const { commandHistory, pushCommand, loadCommandHistory } =
      useCommandHistory(() => null);
    loadCommandHistory();
    pushCommand("whoami");

    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(commandHistory.value).toEqual(["whoami"]); // in-memory still works
  });

  it("replaces in-memory history when loading a key with nothing stored", () => {
    // Switching agents reuses the component instance (AgentEdit renders
    // <agent-shell-session> with no :key), so a load that left the previous
    // agent's commands in memory would persist them under the new agent's key.
    const storage = createFakeStorage();
    global.localStorage = storage;
    let key = "agent-a:history";
    const { commandHistory, pushCommand, loadCommandHistory } =
      useCommandHistory(() => key);

    pushCommand("cat /etc/shadow");
    expect(commandHistory.value).toEqual(["cat /etc/shadow"]);

    key = "agent-b:history";
    loadCommandHistory();

    expect(commandHistory.value).toEqual([]);
    pushCommand("whoami");
    expect(JSON.parse(storage.getItem("agent-b:history"))).toEqual(["whoami"]);
    expect(JSON.parse(storage.getItem("agent-a:history"))).toEqual([
      "cat /etc/shadow",
    ]);
  });

  it("drops non-string entries when loading", () => {
    const storage = createFakeStorage();
    storage.setItem("k:history", JSON.stringify(["ls", 42, null, "ps"]));
    global.localStorage = storage;
    const { commandHistory, loadCommandHistory } = useCommandHistory(
      () => "k:history",
    );
    loadCommandHistory();
    expect(commandHistory.value).toEqual(["ls", "ps"]);
  });

  it("applies the 200-entry cap on load, not just on push", () => {
    const storage = createFakeStorage();
    const saved = Array.from({ length: 250 }, (_, i) => `cmd-${i}`);
    storage.setItem("k:history", JSON.stringify(saved));
    global.localStorage = storage;
    const { commandHistory, loadCommandHistory } = useCommandHistory(
      () => "k:history",
    );
    loadCommandHistory();
    expect(commandHistory.value).toHaveLength(200);
    expect(commandHistory.value[199]).toBe("cmd-249"); // newest kept
  });

  it("restored history is immediately navigable (first Up returns the newest)", () => {
    const storage = createFakeStorage();
    global.localStorage = storage;
    const key = () => "k:history";
    const a = useCommandHistory(key);
    a.pushCommand("one");
    a.pushCommand("two");

    const b = useCommandHistory(key);
    b.loadCommandHistory();
    expect(b.historyIndex.value).toBe(2);
    expect(b.navigatePrev()).toBe("two");
  });

  it("degrades to an empty list on corrupt JSON without throwing", () => {
    const storage = createFakeStorage();
    storage.setItem("k:history", "{not json");
    global.localStorage = storage;
    const { commandHistory, loadCommandHistory } = useCommandHistory(
      () => "k:history",
    );
    expect(() => loadCommandHistory()).not.toThrow();
    expect(commandHistory.value).toEqual([]);
  });

  it("logs and clears the key on corrupt JSON", () => {
    // Without removeItem the same corruption re-hits on every reload, because
    // persist() only overwrites once a new command is pushed.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = createFakeStorage();
    storage.setItem("k:history", "{not json");
    global.localStorage = storage;

    useCommandHistory(() => "k:history").loadCommandHistory();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("[Starkiller]"),
      expect.anything(),
    );
    expect(storage.getItem("k:history")).toBeNull();
    error.mockRestore();
  });

  it("logs and clears the key on valid JSON that is not an array", () => {
    // "5", "{}" and "null" parse cleanly, fail Array.isArray, and never reach
    // the catch -- so the poison value would otherwise stay forever.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = createFakeStorage();
    storage.setItem("k:history", '{"not":"an array"}');
    global.localStorage = storage;

    const { commandHistory, loadCommandHistory } = useCommandHistory(
      () => "k:history",
    );
    loadCommandHistory();

    expect(commandHistory.value).toEqual([]);
    expect(error).toHaveBeenCalled();
    expect(storage.getItem("k:history")).toBeNull();
    error.mockRestore();
  });

  it("logs a failing write once and stops retrying for the session", () => {
    // Quota is sticky: retrying on every push means the reload reads back a
    // stale snapshot, so history looks like it is working while silently
    // missing everything after the failure.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const setItem = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    global.localStorage = {
      getItem: () => null,
      setItem,
      removeItem: () => {},
    };

    const { pushCommand, commandHistory } = useCommandHistory(
      () => "k:history",
    );
    pushCommand("one");
    pushCommand("two");
    pushCommand("three");

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(commandHistory.value).toEqual(["one", "two", "three"]);
    error.mockRestore();
  });

  it("swallows a throwing localStorage on both load and persist", () => {
    global.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    };
    const { pushCommand, loadCommandHistory, commandHistory } =
      useCommandHistory(() => "k:history");
    expect(() => loadCommandHistory()).not.toThrow();
    expect(() => pushCommand("x")).not.toThrow();
    expect(commandHistory.value).toEqual(["x"]); // in-memory still works
  });

  it("in-memory mode (no getter) never touches localStorage", () => {
    const setItem = vi.fn();
    global.localStorage = {
      getItem: () => null,
      setItem,
      removeItem: () => {},
    };
    const { pushCommand } = useCommandHistory();
    pushCommand("x");
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("historyMatches", () => {
  it("returns entries that start with the input, most-recent-first, de-duplicated", () => {
    const history = ["git status", "ls", "git log", "git status"];
    expect(historyMatches(history, "git")).toEqual(["git status", "git log"]);
  });

  it("returns an empty array for empty or whitespace-only input", () => {
    const history = ["ls", "pwd"];
    expect(historyMatches(history, "")).toEqual([]);
    expect(historyMatches(history, "   ")).toEqual([]);
    expect(historyMatches(history, null)).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(historyMatches(["ls", "pwd"], "xyz")).toEqual([]);
  });

  it("skips non-string entries instead of throwing", () => {
    // localStorage is shared with everything else on the origin, so a
    // hand-edited or version-skewed entry can be any JSON type. This runs
    // inside a keydown handler -- throwing kills Tab completion for the
    // session and pops a snackbar that points nowhere near localStorage.
    const history = ["ls -la", 42, null, undefined, { cmd: "ls" }, "ls -l"];
    expect(() => historyMatches(history, "ls")).not.toThrow();
    expect(historyMatches(history, "ls")).toEqual(["ls -l", "ls -la"]);
  });
});
