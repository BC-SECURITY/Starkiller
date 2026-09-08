import { ref } from "vue";

// Command-history navigation shared by AgentTerminal and AgentShellSession.
// History persists to localStorage under whatever key `storageKeyGetter`
// returns. No getter, or a getter returning null, means in-memory only -- the
// latter is how both components stay off the shared "…-undefined" key while
// their agent's session_id is still in flight.
//
// `historyIndex` equals `commandHistory.length` when "at the bottom" (not
// currently navigating). Navigating up stashes the in-progress line as `draft`;
// navigating back down past the newest entry restores it.
const MAX_HISTORY = 200;

// Pure prefix-matcher for the Shell tab's Tab completion: history entries that
// start with `currentInput`, de-duplicated, most-recent-first. Empty or
// whitespace-only input yields no matches (never dump the whole history).
export function historyMatches(history, currentInput) {
  const prefix = currentInput ?? "";
  if (prefix.trim() === "") return [];
  const seen = new Set();
  const out = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    // Tolerates non-string entries: this runs inside a keydown handler, where a
    // throw would kill Tab completion for the rest of the session. (Entry types
    // only -- a non-array `history` still throws above.)
    if (typeof entry !== "string") continue;
    if (entry.startsWith(prefix) && !seen.has(entry)) {
      seen.add(entry);
      out.push(entry);
    }
  }
  return out;
}

export function useCommandHistory(storageKeyGetter) {
  const commandHistory = ref([]);
  const historyIndex = ref(0);
  let draft = "";
  let persistDisabled = false;

  // A null/empty key means "no durable identity yet" -- the consumer knows the
  // key it would write is not this agent's (see AgentShellSession's
  // historyStorageKey). Stay in memory rather than touch a shared key.
  function storageKey() {
    return storageKeyGetter ? storageKeyGetter() : null;
  }

  function persist() {
    const key = storageKey();
    if (!key || persistDisabled) return;
    try {
      localStorage.setItem(key, JSON.stringify(commandHistory.value));
    } catch (err) {
      // Quota / unavailable storage is sticky, so stop after the first failure
      // rather than retrying on every push: a later write that happens to
      // succeed would leave a snapshot missing everything in between, and
      // partial-and-wrong history is harder to diagnose than none. The flag is
      // per composable instance, so it lasts until this terminal remounts.
      persistDisabled = true;
      // eslint-disable-next-line no-console
      console.error(
        `[Starkiller] Command history is no longer being saved for this terminal (${key}) until it remounts:`,
        err,
      );
    }
  }

  function pushCommand(cmd) {
    const last = commandHistory.value[commandHistory.value.length - 1];
    if (cmd !== last) {
      commandHistory.value.push(cmd);
      if (commandHistory.value.length > MAX_HISTORY) {
        commandHistory.value.splice(
          0,
          commandHistory.value.length - MAX_HISTORY,
        );
      }
      persist();
    }
    historyIndex.value = commandHistory.value.length;
    draft = "";
  }

  function navigatePrev(currentInput = "") {
    if (historyIndex.value === commandHistory.value.length) {
      draft = currentInput;
    }
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
    if (historyIndex.value === commandHistory.value.length - 1) {
      historyIndex.value = commandHistory.value.length;
      return draft;
    }
    return undefined;
  }

  function loadCommandHistory() {
    const key = storageKey();
    if (!key) return;
    try {
      const saved = localStorage.getItem(key);
      // Assign unconditionally, including the nothing-stored case: a load means
      // "this key's history is now the history". Leaving the previous key's
      // entries in memory is how one agent's commands end up persisted under
      // another agent's key on the next push.
      commandHistory.value = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        // Valid JSON that isn't an array ("5", "{}", "null") parses cleanly and
        // never reaches the catch, so it needs the same treatment as a parse
        // failure -- otherwise the poison value survives every reload.
        if (!Array.isArray(parsed)) throw new Error("not an array");
        // Anything on the origin can write here, so treat stored entries as
        // untrusted input: keep only strings, and re-apply the cap that
        // pushCommand enforces on the way out.
        commandHistory.value = parsed
          .filter((entry) => typeof entry === "string")
          .slice(-MAX_HISTORY);
      }
    } catch (err) {
      commandHistory.value = [];
      // Drop the unreadable value: persist() only overwrites once a new command
      // is pushed, so leaving it means re-hitting this on every reload.
      // useTerminalOutput does the same log-and-remove, but only for genuinely
      // unparseable JSON -- it has no Array.isArray check, so a stored "5" or
      // "{}" still lands in its outputLines as-is. Don't read this as parity.
      try {
        localStorage.removeItem(key);
      } catch {
        // storage unavailable entirely -- nothing further to clean up
      }
      // eslint-disable-next-line no-console
      console.error(
        "[Starkiller] Discarded unreadable command history from localStorage:",
        err,
      );
    }
    historyIndex.value = commandHistory.value.length;
    draft = "";
  }

  return {
    commandHistory,
    historyIndex,
    pushCommand,
    navigatePrev,
    navigateNext,
    loadCommandHistory,
  };
}
