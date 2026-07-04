import { nextTick } from "vue";
import { useTerminalOutput } from "@/composables/useTerminalOutput";

function createFakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

describe("useTerminalOutput", () => {
  const KEY = "test-storage-key";
  let getStorageKey;

  beforeEach(() => {
    global.localStorage = createFakeStorage();
    getStorageKey = () => KEY;
  });

  it("addLine pushes a correctly-shaped entry with the default cssClasses", () => {
    const { outputLines, addLine } = useTerminalOutput(getStorageKey);
    addLine("hello");
    expect(outputLines.value).toEqual([
      { content: "hello", cssClasses: "preserve-newlines" },
    ]);
  });

  it("addError pushes with the error-text class", () => {
    const { outputLines, addError } = useTerminalOutput(getStorageKey);
    addError("boom");
    expect(outputLines.value).toEqual([
      { content: "boom", cssClasses: "error-text" },
    ]);
  });

  it("addInfo pushes with the info-text class", () => {
    const { outputLines, addInfo } = useTerminalOutput(getStorageKey);
    addInfo("fyi");
    expect(outputLines.value).toEqual([
      { content: "fyi", cssClasses: "info-text" },
    ]);
  });

  it("does not persist a line pushed via addLine (matches today's shallow-watch behavior)", async () => {
    const setItemSpy = vi.spyOn(global.localStorage, "setItem");
    const { addLine } = useTerminalOutput(getStorageKey);
    addLine("typed output");
    await nextTick();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("persists on a full reassignment of outputLines, capped at 500 lines", async () => {
    const { outputLines } = useTerminalOutput(getStorageKey);
    const lines = Array.from({ length: 600 }, (_, i) => ({
      content: `line-${i}`,
      cssClasses: "preserve-newlines",
    }));
    outputLines.value = lines;
    await nextTick();
    const stored = JSON.parse(global.localStorage.getItem(KEY));
    expect(stored).toHaveLength(500);
    expect(stored[0].content).toBe("line-100");
    expect(stored[499].content).toBe("line-599");
  });

  it("swallows a localStorage quota error on persist", async () => {
    global.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const { outputLines } = useTerminalOutput(getStorageKey);
    outputLines.value = [{ content: "x", cssClasses: "preserve-newlines" }];
    await expect(nextTick()).resolves.not.toThrow();
  });

  it("loadHistory parses valid JSON from storage", () => {
    global.localStorage.setItem(
      KEY,
      JSON.stringify([{ content: "saved", cssClasses: "preserve-newlines" }]),
    );
    const { outputLines, loadHistory } = useTerminalOutput(getStorageKey);
    loadHistory();
    expect(outputLines.value).toEqual([
      { content: "saved", cssClasses: "preserve-newlines" },
    ]);
  });

  it("clears the storage key on invalid JSON instead of throwing", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    global.localStorage.setItem(KEY, "{not json");
    const { outputLines, loadHistory } = useTerminalOutput(getStorageKey);
    expect(() => loadHistory()).not.toThrow();
    expect(outputLines.value).toEqual([]);
    expect(global.localStorage.getItem(KEY)).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });
});
