import { ref, watch, nextTick } from "vue";

// Owns the interactive-console output buffer shared by AgentTerminal and
// AgentShellSession: the line buffer, the scrollable output element, and
// localStorage persistence.
//
// `getStorageKey` is a getter (e.g. `() => instance.proxy.storageName()`),
// not a plain string -- storageName() is a `methods` entry, and Vue installs
// `methods` onto the instance proxy *after* setup() runs, so a plain-string
// call site would throw at setup() time. The getter defers the call until
// loadHistory()/the persist watch actually fire.
//
// The persist watch below sources the `outputLines` REF itself, never
// `outputLines.value` -- watching the ref tracks only its own dependency, so
// `.push()` on the array it holds does not fire the callback, matching the
// shallow, getter-based `watch: { outputLines() {} }` both original
// components used. Watching `.value` would auto-deep and fire on every push,
// silently persisting every typed command -- a behavior change this
// extraction does not make. Today, output appended via addLine during a
// session is never separately persisted; only a full reassignment of
// outputLines (a fresh load, or `clear`) triggers a write.
//
// MAX_LINES bounds both the persisted copy (below, a localStorage-quota
// concern) and the live in-memory buffer (addLine, a DOM/memory-growth
// concern over a long session) -- one constant so the two never drift apart.
const MAX_LINES = 500;

// The 500-line cap and quota-safe try/catch in persistHistory below are
// applied uniformly to both components -- this is a harmonization, not a
// restatement of prior behavior: AgentTerminal's original watcher had
// neither of these safeguards before this extraction.
export function useTerminalOutput(getStorageKey) {
  const output = ref(null);
  const outputLines = ref([]);

  function scrollToBottom() {
    nextTick(() => {
      if (output.value) {
        output.value.scrollTop = output.value.scrollHeight;
      }
    });
  }

  function addLine(content, cssClasses = "preserve-newlines") {
    // Push first, then trim from the front -- keeps the buffer at exactly
    // MAX_LINES at rest instead of oscillating between MAX_LINES and
    // MAX_LINES+1. Like `.push()`, `.splice()` mutates the array in place
    // without reassigning `outputLines.value`, so it does not trigger the
    // persist watch below either.
    outputLines.value.push({ content, cssClasses });
    if (outputLines.value.length > MAX_LINES) {
      outputLines.value.splice(0, outputLines.value.length - MAX_LINES);
    }
    scrollToBottom();
  }

  function addError(content) {
    addLine(content, "error-text");
  }

  function addInfo(content) {
    addLine(content, "info-text");
  }

  function persistHistory() {
    try {
      const toStore =
        outputLines.value.length > MAX_LINES
          ? outputLines.value.slice(-MAX_LINES)
          : outputLines.value;
      localStorage.setItem(getStorageKey(), JSON.stringify(toStore));
    } catch {
      // localStorage quota exceeded -- ignore
    }
  }

  watch(outputLines, persistHistory, { deep: false });

  function loadHistory() {
    try {
      const savedHistory = localStorage.getItem(getStorageKey());
      if (savedHistory) {
        outputLines.value = JSON.parse(savedHistory);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load terminal history from localStorage:", err);
      localStorage.removeItem(getStorageKey());
    }
    scrollToBottom();
  }

  return { output, outputLines, addLine, addError, addInfo, loadHistory };
}
