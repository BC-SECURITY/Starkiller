import { ref } from "vue";

// Command-history navigation shared by AgentTerminal and AgentShellSession --
// the ArrowUp/ArrowDown subset of each component's handleKeyEvents. Terminal
// layers Tab/Space autocomplete handling on top of this; that stays local to
// AgentTerminal since Shell has no autocomplete.
export function useCommandHistory() {
  const commandHistory = ref([]);
  const historyIndex = ref(-1);

  function pushCommand(cmd) {
    commandHistory.value.push(cmd);
    historyIndex.value = commandHistory.value.length;
  }

  function navigatePrev() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      return commandHistory.value[historyIndex.value];
    }
    return undefined;
  }

  function navigateNext() {
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      return commandHistory.value[historyIndex.value];
    }
    return undefined;
  }

  return {
    commandHistory,
    historyIndex,
    pushCommand,
    navigatePrev,
    navigateNext,
  };
}
