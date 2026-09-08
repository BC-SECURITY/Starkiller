import MarkdownIt from "markdown-it";
import { isSafeUrl } from "@/utils/is-safe-url";

// One shared parser for all of chat. A markdown-it instance is not cheap to
// construct and chat renders one component per message, so this deliberately
// is not built per-component (which is what vue-markdown-render does, and why
// chat does not use it). PluginMarketplace.vue and PluginEdit.vue still render
// their markdown through vue-markdown-render and do NOT go through this
// hardened config.
//
// This config is the entire XSS boundary for chat: there is no post-render
// sanitizer behind it and no CSP. Every `renderer.rules.*` override below must
// therefore emit escaped output — via md.utils.escapeHtml for any content it
// interpolates itself, or by delegating to markdown-it's own renderer.
const md = new MarkdownIt({
  // Raw HTML in a message is escaped rather than injected. This is the primary
  // XSS control: messages arrive from other operators over the socket.
  html: false,
  linkify: true,
  // Chat convention — a single newline is a line break, not a paragraph join.
  breaks: true,
});

// `lheading` must be disabled alongside `heading`, otherwise a line of "---"
// beneath text silently becomes a setext heading.
//
// `image` is deliberately NOT in this list. Disabling the image rule is the
// obvious move and it is wrong: "!" then degrades to literal text while
// [alt](url) is still parsed as a link, resurfacing the attacker-controlled
// URL as a clickable target. Keeping the rule enabled produces an image token
// we fully control, which the renderer override below discards.
//
// `code` (indented code blocks) stays enabled on purpose: it preserves column
// alignment for pasted command output. `hr` also stays enabled; a horizontal
// rule is harmless in a narrow column.
//
// `table` was originally in this list — a table can't fit a 380px column —
// but the owner tested it and wants tables rendered. They are now wrapped in
// a horizontally scrolling container (see the table_open/table_close
// overrides below) so a wide table scrolls in its own box instead of
// stretching the drawer.
//
// `escape` is disabled because markdown's backslash-escape rule silently
// corrupts pasted Windows and UNC paths: the rule consumes the backslash
// itself and leaves the punctuation behind, so `\\10.10.14.7\share\payload.dll`
// loses one of its two leading backslashes, and `C:\temp\.hidden`,
// `C:\temp\*.log`, and `C:\temp\_private` each lose the backslash before the
// punctuation character while that character survives. Operators
// paste these constantly in a C2 chat, and a silently mangled path is worse
// than losing the ability to escape markdown punctuation. The accepted cost
// is that `\*literal\*` now shows its backslashes instead of suppressing
// emphasis.
md.disable(["heading", "lheading", "escape"]);

// Reuse the shared scheme allowlist rather than defining a second policy.
// Restricts links to http: and https:.
//
// This *replaces* markdown-it's own BAD_PROTO_RE denylist rather than chaining
// with it, which is a strict improvement (an allowlist dominates a four-scheme
// denylist) but does mean isSafeUrl is now the whole scheme policy for chat.
// It is shared with the plugin marketplace: widening it there — adding
// relative URLs, defaulting allowMailto to true — silently widens what an
// arbitrary operator can make clickable in chat.
md.validateLink = (url) => isSafeUrl(url, { allowMailto: false });

// Images render as alt text only: no href, no outbound request, no beaconing.
md.renderer.rules.image = (tokens, idx) =>
  md.utils.escapeHtml(tokens[idx].content || "");

const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

// no-referrer keeps the Empire host and URL out of the Referer header when an
// operator clicks a link another operator pasted.
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  tokens[idx].attrSet("referrerpolicy", "no-referrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// Fenced and indented blocks render identically.
//
// Each source line becomes its own block-level span because the hanging indent
// that distinguishes a wrapped continuation from a real newline needs a block
// per line — `text-indent` only affects a block's first line, so a single text
// node containing newlines cannot produce a per-line indent.
//
// The raw source also goes into `data-code` so the copy button reproduces it.
// This is close to the source but explicitly NOT a byte-for-byte guarantee.
// Two transformations happen before this function sees the content, and both
// are deliberate:
//
//   - markdown-it's core `normalize` pass rewrites CRLF and lone CR to LF, and
//     NUL to U+FFFD, so CRLF input copies back as LF.
//   - an indented code block arrives already stripped of its four-space
//     indent, so it copies as the code itself rather than as the indented
//     markdown that produced it. (The `.replace(/\n$/, "")` below is not a
//     third: it removes the block's terminating newline only, so a genuine
//     trailing blank line inside a fence still survives.)
//
// Do NOT reconstruct this by walking the spans instead: `textContent`
// concatenates them with no separator and would silently copy a mangled
// one-liner — the exact failure this layout was chosen to avoid.
function renderCodeBlock(tokens, idx) {
  const raw = tokens[idx].content.replace(/\n$/, "");
  const lines = raw
    .split("\n")
    .map((line) => `<span class="line">${md.utils.escapeHtml(line)}</span>`)
    .join("");
  return (
    `<div class="chat-code" data-code="${md.utils.escapeHtml(raw)}">` +
    `<button type="button" class="chat-code-copy" aria-label="Copy code">Copy</button>` +
    `<pre><code>${lines}</code></pre>` +
    `</div>`
  );
}

md.renderer.rules.fence = renderCodeBlock;
md.renderer.rules.code_block = renderCodeBlock;

// A table is the other kind of content that can't fit a 380px column, so it
// gets the same wide-bubble treatment as a code block plus its own scroll
// container: `.chat-table` scrolls horizontally so a wide table never
// stretches the drawer itself.
//
// `.chat-code` and `.chat-table` are also what Chat.vue's
// `.chat-msg:has(.chat-code, .chat-table)` rule keys off to widen the bubble,
// so renaming either class silently costs the full-width treatment.
md.renderer.rules.table_open = () => '<div class="chat-table"><table>';
md.renderer.rules.table_close = () => "</table></div>";

export function renderChatMessage(text) {
  let source;
  if (typeof text === "string") {
    source = text;
  } else {
    // Anything that isn't a string is malformed — every legitimate caller
    // sends one. Both call sites are hard-guarded to type === "text", and a
    // system message renders its own text directly without coming through
    // here, so there is no such thing as a legitimately absent message: a
    // nullish payload means a server sent chat/message with no `message`
    // field, or a schema drifted. It is logged for exactly that reason —
    // otherwise it renders as an empty padded bubble with the sender's name
    // and no trace anywhere. Non-nullish values are coerced rather than
    // dropped so the content still stays visible.
    console.error("[Starkiller] Chat message content was not a string:", text);
    source = text === null || text === undefined ? "" : String(text);
  }
  try {
    return md.render(source);
  } catch (error) {
    // Degrade to an unformatted message, never a blank one — silently
    // dropping an operator's message is the worst outcome here. Note this
    // catches more than a parse failure: md.render() also runs every custom
    // renderer rule in this file, so a bug in renderCodeBlock or link_open
    // lands here too and flattens every message of that kind to plain text.
    console.error("[Starkiller] Chat markdown render failed:", error);
    return md.utils.escapeHtml(source);
  }
}
