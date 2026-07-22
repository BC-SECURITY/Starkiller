import dayjs from "@/plugins/dayjs";

export const TIMEFRAME_OPTIONS = ["Second", "Minute", "Hour", "Day"];

export const TIMEFRAME_UNIT = {
  Second: "second",
  Minute: "minute",
  Hour: "hour",
  Day: "day",
};

// Returns value if it is a TIMEFRAME_OPTIONS member; otherwise warns and
// returns fallback. Pass null as fallback to use this as a setter validator
// (caller checks the return for null and skips the write).
export function safeTimeframe(value, fallback = "Second", context = "") {
  if (TIMEFRAME_OPTIONS.includes(value)) return value;
  if (value !== undefined && value !== null) {
    const prefix = context ? `[${context}] ` : "";
    // eslint-disable-next-line no-console
    console.warn(
      `${prefix}invalid timeframe "${value}", falling back to "${fallback}"`,
    );
  }
  return fallback;
}

// Factory for store-backed timeframe get/set computeds. Collapses three
// near-identical 14-line blocks (Dashboard + AgentStats × 2) and bundles
// three behaviors that should always travel together: read-side validation,
// write-side validation with silent rejection of invalid values, and a
// same-value guard to suppress redundant Pinia mutations (which trigger
// pinia-plugin-persistedstate's JSON.stringify to localStorage).
//
// `useStore` is the Pinia store factory itself (e.g. useApplicationStore);
// the get/set close over it and re-invoke per access so they don't depend
// on the consuming component's `this`.
export function timeframeComputed(useStore, key, fallback) {
  return {
    get() {
      return safeTimeframe(useStore()[key], fallback, key);
    },
    set(val) {
      const sanitized = safeTimeframe(val, null, key);
      if (sanitized === null) return;
      const store = useStore();
      if (store[key] === sanitized) return;
      store[key] = sanitized;
    },
  };
}

// Local calendar-day format. Named so both charts express "the operator's
// local day" identically instead of via ad-hoc inline format()/split() calls.
export const DAY_FORMAT = "YYYY-MM-DD";

// Bucket key for client-side day grouping: the LOCAL calendar day of a
// timestamp. Use only where the client buckets raw events (e.g. AgentStats'
// task chart). Do NOT use it to relabel server-aggregated checkin buckets —
// those carry the backend's UTC boundaries and re-deriving them locally would
// shift labels by a day for operators far from UTC.
export function dayKey(ts) {
  return dayjs(ts).format(DAY_FORMAT);
}
