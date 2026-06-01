// Minimal subset of `semver.satisfies` covering the only forms used in this
// codebase: a single comparator (>=, <=, >, <, =) followed by a dotted numeric
// version (e.g. ">=4.0", "<5.2"). Versions may have any number of numeric
// parts; missing parts are treated as 0 (so "5" === "5.0" === "5.0.0"), which
// matches the comparison semantics for the simple ranges we use.
//
// A leading "v" or "V" is tolerated (so "v5.2.0" / "V5.2.0" parse the same as
// "5.2.0") to match semver's behavior (node-semver strips a leading [vV]).
// Empire's version endpoint is contractually plain dotted, but a stray prefix
// upstream would silently kill the >=4.0 socket-panel gate and the <5.2
// compatibility warning, so accept it defensively.
//
// Returns false for non-numeric versions (e.g. "unknown") — same as semver's
// behavior. Throws for unrecognized range syntax so a typo doesn't silently
// no-op.

function parseVersion(v) {
  if (typeof v !== "string") return null;
  const stripped = v.replace(/^[vV]/, "");
  const parts = stripped.split(".");
  const nums = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    nums.push(parseInt(p, 10));
  }
  return nums.length ? nums : null;
}

function cmp(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

const OPS = {
  ">=": (c) => c >= 0,
  "<=": (c) => c <= 0,
  ">": (c) => c > 0,
  "<": (c) => c < 0,
  "=": (c) => c === 0,
};

export function satisfies(version, range) {
  const m = range.match(/^\s*(>=|<=|>|<|=)?\s*(\d+(?:\.\d+)*)\s*$/);
  if (!m) throw new Error(`Unsupported version range: ${range}`);
  const v = parseVersion(version);
  if (v == null) return false;
  const target = parseVersion(m[2]);
  return OPS[m[1] || "="](cmp(v, target));
}
