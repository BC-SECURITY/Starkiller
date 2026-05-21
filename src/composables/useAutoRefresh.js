import { onBeforeUnmount } from "vue";

// Shared auto-refresh polling helper extracted from the agent/plugin tables.
// `start()` runs the callback once immediately and then on every `intervalMs`
// tick (matching the original "fetch now, then poll" behavior); `stop()` clears
// the interval. The interval is also cleared automatically on unmount.
//
// Each component drives start/stop synchronously from its own boolean prop
// watcher so the cadence and the immediate-fetch timing stay identical to the
// hand-rolled setInterval/beforeUnmount code this replaces.
// eslint-disable-next-line import/prefer-default-export
export function useAutoRefresh(callback, intervalMs) {
  let refreshInterval = null;

  function start() {
    callback();
    refreshInterval = setInterval(() => {
      callback();
    }, intervalMs);
  }

  function stop() {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  onBeforeUnmount(() => {
    clearInterval(refreshInterval);
  });

  return { start, stop };
}
