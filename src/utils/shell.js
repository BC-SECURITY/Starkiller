// Characters safe to leave bare in every POSIX shell we might hand a command
// to. Deliberately an allowlist rather than a blocklist of metacharacters: a
// missed metacharacter in a blocklist is a broken (or dangerous) command,
// whereas a missed safe character is only a redundant pair of quotes. It
// covers plain distribution names (letters, digits, `.`, `-`, `_`); `+` is in
// there because it is not a metacharacter anywhere, not because a bare name
// can contain one.
const SHELL_SAFE = /^[A-Za-z0-9._+-]+$/;

// POSIX shells ONLY (sh/bash/zsh) — do not reach for this to build a command
// for cmd.exe or PowerShell. cmd.exe does not treat `'` as a quote at all, so
// the output would be actively broken there (`>` still redirects and the
// quotes reach the program), and PowerShell escapes an embedded quote by
// doubling it, not with the `'\''` form below. The one caller targets the
// Empire server host, which is POSIX.
//
// Render `value` as a single shell word that can be pasted verbatim. Words
// that need no quoting are returned as-is so the common case stays readable;
// everything else is single-quoted, with embedded single quotes closed,
// escaped and reopened ('\'') since single quotes have no escape of their own.
export function shellQuote(value) {
  // Coerce first: this runs inside a Vue computed on untyped backend data, and
  // a throw here aborts the surrounding subtree — the operator would be left
  // with an *empty* dependency warning rather than a visibly wrong command,
  // losing the only on-screen explanation of why the plugin failed to load.
  // Coercing also stops a null element from returning bare and vanishing
  // inside join(" ").
  const str = value == null ? "" : String(value);
  if (SHELL_SAFE.test(str)) return str;
  return `'${str.replaceAll("'", `'\\''`)}'`;
}
