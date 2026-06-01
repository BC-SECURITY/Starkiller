// Normalizes a handleError() `detail` (string | 422 array | other) into
// { fields: { [name]: string[] }, formLevel: string[] }. Widget-agnostic:
// file-field routing to the form-level banner happens later, in
// routeErrorsByKind() inside useServerErrors.
const ENVELOPE_SEGMENTS = new Set([
  "body",
  "options",
  "query",
  "path",
  "__root__",
]);

// Common backend message keys, ordered by preference. Order is load-bearing —
// pinned by the precedence test in `normalizeServerErrors.spec.js`. Don't
// alphabetize.
export const MESSAGE_KEYS = ["message", "error", "detail", "description"];

// Pull a readable string out of a single item (an array element, an object
// detail, or a primitive). Shared between the banner path (fallbackMessage)
// and the toast path (summarizeForToast) so the two surfaces can't disagree
// when one walks more shapes than the other. Returns null when nothing usable
// is found; the caller picks a fallback.
function extractMessage(item) {
  if (item == null) return null;
  if (typeof item === "string") return item.trim() ? item : null;
  if (typeof item === "object") {
    if (typeof item.msg === "string" && item.msg.trim()) return item.msg;
    for (const key of MESSAGE_KEYS) {
      const v = item[key];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

// Best-effort human-readable text for a detail/item that lacks a `msg`. Neither
// `[object Object]` nor a raw `{"code":500,...}` blob is useful in the banner,
// so try MESSAGE_KEYS / type / JSON in turn.
function fallbackMessage(item) {
  if (item == null) return "Validation error";
  const extracted = extractMessage(item);
  if (extracted != null) return extracted;
  if (typeof item === "object" && item.type != null)
    return `Validation error (${String(item.type)})`;
  try {
    return JSON.stringify(item);
  } catch {
    return "Validation error";
  }
}

export function normalizeServerErrors(detail, knownFieldNames = []) {
  const known = new Set(knownFieldNames);
  const fields = {};
  const formLevel = [];

  if (Array.isArray(detail)) {
    if (detail.length === 0) {
      // A 4xx whose detail is an empty array would otherwise surface nothing
      // at all (empty banner, no field errors) — the exact "error into the
      // void" this feature exists to prevent. Show a generic message instead.
      formLevel.push(
        "The server rejected the request but returned no details.",
      );
    }
    detail.forEach((item) => {
      const loc = Array.isArray(item?.loc) ? item.loc : [];
      const field = loc.find(
        (seg) => typeof seg === "string" && !ENVELOPE_SEGMENTS.has(seg),
      );
      // Only surface a non-blank string msg inline. A present-but-blank one
      // ("" / "   ") falls back to fallbackMessage rather than rendering a
      // blank inline error; a missing msg likewise falls back to its type/JSON
      // so the field shows something explanatory.
      const msg =
        typeof item?.msg === "string" && item.msg.trim()
          ? item.msg
          : fallbackMessage(item);
      if (field && known.has(field)) {
        if (!fields[field]) fields[field] = [];
        fields[field].push(msg);
      } else {
        formLevel.push(msg);
      }
    });
  } else if (typeof detail === "string") {
    // Guard a blank/whitespace string detail the same way the Error path
    // (normalizeSubmitError) and the empty-array path above do — otherwise it
    // renders an empty prominent banner while the snack stays gated off.
    formLevel.push(
      detail.trim()
        ? detail
        : "The server rejected the request but returned no details.",
    );
  } else if (detail != null && typeof detail === "object") {
    formLevel.push(fallbackMessage(detail));
  } else {
    // Catch-all for an unexpected primitive detail. The sole caller
    // (useServerErrors.rebuild) filters null/undefined upstream, so detail is
    // a number/boolean here; String() can't throw on a primitive. This just
    // avoids a blank banner for malformed input.
    formLevel.push(String(detail));
  }

  return { fields, formLevel };
}

// Convert anything caught in a submit `.catch(err => ...)` into:
//   { serverError, snackText }
// where `serverError` is suitable for passing to <general-form>'s
// :server-errors (array | string | object), and `snackText` is a short
// user-readable string for an inline toast.
//
// Context: axios-instance handleError() unwraps `response.data.detail` when
// present and otherwise returns the raw Error. So `err` here is either the
// unwrapped detail or an Error instance.
export function normalizeSubmitError(err, fallback = "Operation failed.") {
  if (err instanceof Error) {
    // Trim before the truthy check so a whitespace-only message ("   ")
    // falls back to the supplied fallback rather than rendering blank.
    const trimmed = typeof err.message === "string" ? err.message.trim() : "";
    const text = trimmed || fallback;
    return { serverError: [text], snackText: text };
  }
  return { serverError: err, snackText: summarizeForToast(err, fallback) };
}

function summarizeForToast(detail, fallback) {
  // Both surfaces (banner via fallbackMessage, snack via this) route through
  // extractMessage so a key that resolves on one side resolves on the other.
  // Mismatched extraction is exactly the silent-failure class this work
  // targets — banner shows "42" while snack shows the generic fallback.
  if (Array.isArray(detail)) {
    if (detail.length === 0) return fallback;
    return extractMessage(detail[0]) ?? fallback;
  }
  return extractMessage(detail) ?? fallback;
}
