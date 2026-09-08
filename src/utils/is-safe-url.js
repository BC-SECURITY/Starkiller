// Allowlists URL schemes before binding untrusted plugin/marketplace
// metadata to href.
//
// Also installed as markdown-it's `validateLink` in utils/chat-markdown.js,
// where it REPLACES the library's own scheme denylist — so it is the entire
// link-scheme policy for operator-to-operator chat messages, not just a
// marketplace concern. Loosening it (allowing relative URLs, defaulting
// allowMailto to true) widens that too. Uses the URL constructor rather than a regex: per the
// WHATWG URL spec it lowercases the scheme and strips leading/embedded
// control characters before parsing, so "JavaScript:", "  javascript:", and
// "java\nscript:" are all correctly rejected without extra code. A
// substring-based check would not be safe here — a javascript: payload can
// itself contain "https://" as a substring (e.g. to fetch an exfil URL).
export function isSafeUrl(url, { allowMailto = false } = {}) {
  if (typeof url !== "string") return false;
  try {
    // No base argument: bare/relative/protocol-relative strings must throw
    // and be rejected. These fields are meant to be absolute URLs (or
    // mailto:), never relative paths.
    const { protocol } = new URL(url);
    if (protocol === "http:" || protocol === "https:") return true;
    return allowMailto && protocol === "mailto:";
  } catch {
    return false;
  }
}
