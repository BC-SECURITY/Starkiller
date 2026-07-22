import { useCommandHistory } from "@/composables/useCommandHistory";

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

  it("navigatePrev returns undefined when history is empty", () => {
    const { navigatePrev } = useCommandHistory();
    expect(navigatePrev()).toBeUndefined();
  });

  it("navigatePrev/navigateNext walk history and stop at the boundaries", () => {
    const { pushCommand, navigatePrev, navigateNext, historyIndex } =
      useCommandHistory();
    pushCommand("whoami");
    pushCommand("ps");

    expect(navigatePrev()).toBe("ps");
    expect(navigatePrev()).toBe("whoami");
    expect(navigatePrev()).toBeUndefined(); // stays at the start
    expect(historyIndex.value).toBe(0);

    expect(navigateNext()).toBe("ps");
    expect(navigateNext()).toBeUndefined(); // stays at the end
    expect(historyIndex.value).toBe(1);
  });
});
