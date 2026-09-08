<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="chat-md" @click="onClick" v-html="rendered" />
</template>

<script>
import { renderChatMessage } from "@/utils/chat-markdown";
import { copyToClipboard } from "@/utils/clipboard";

export default {
  name: "ChatMessageContent",
  inject: ["snack"],
  props: {
    // Deliberately untyped rather than `String`. renderChatMessage hardens
    // against a non-string payload from the socket (it coerces and logs), and
    // declaring String here would make that same payload also trip a Vue prop
    // warning — two complaints about one malformed message, one of them from
    // the layer that already handles it.
    text: {
      type: null,
      required: true,
    },
  },
  computed: {
    rendered() {
      return renderChatMessage(this.text);
    },
  },
  methods: {
    // Delegated rather than bound per button: the code blocks are produced as
    // an HTML string by the markdown renderer, so there are no Vue-managed
    // nodes to attach a handler to.
    onClick(event) {
      const button = event.target.closest(".chat-code-copy");
      if (!button) return;
      const block = button.closest(".chat-code");
      if (!block) {
        // The renderer always nests .chat-code-copy inside .chat-code (see
        // renderCodeBlock in chat-markdown.js) — this branch should be
        // unreachable. Logged so a future drift between the renderer's markup
        // and this handler's assumptions doesn't fail silently: without this,
        // the button would keep rendering and looking clickable while doing
        // nothing, with zero diagnostic signal.
        console.error(
          "[Starkiller] Copy button rendered outside .chat-code — renderer/handler contract broken",
        );
        return;
      }
      // dataset decodes the escaped attribute back to the original source,
      // modulo the normalizations listed in chat-markdown.js's data-code
      // comment. Do not use textContent of the <pre>; it concatenates the
      // line spans with no separator.
      const { code } = block.dataset;
      // An empty fence renders a real block with a real copy button and
      // data-code="". Copying that would resolve and report "Copied to
      // clipboard" while leaving the clipboard empty (or, worse, leaving
      // whatever was there before) — so say nothing happened instead.
      if (!code) {
        this.snack.info("Nothing to copy — this code block is empty");
        return;
      }
      copyToClipboard(code, this.snack);
    },
  },
};
</script>

<style lang="scss">
/*
 * Deliberately NOT `scoped`. The markdown is injected via `v-html` as a raw
 * HTML string, so Vue never sees those nodes and never applies its scoped
 * `data-v-*` attribute to them. If this block were made `scoped`, every rule
 * below `.chat-md` itself would compile against an attribute selector that
 * matches nothing in the injected markup — every rule would still parse and
 * ship, just silently do nothing, unstyling all rendered markdown except the
 * outer div. Do not "tidy this up" to `scoped`.
 */
.chat-md {
  // Declared once at the root and inherited, rather than repeated on every
  // element that needs it (a, code, .chat-code, p, li, blockquote…) — an
  // unfenced long token, a base64 stager or a hash, is the common paste in
  // this app, and prose and list items need breaking just as much as code
  // does. Anything added below inherits it for free; only override it where
  // an element must NOT break (see .chat-table's cells).
  overflow-wrap: anywhere;

  // markdown-it wraps prose in <p>; without this every bubble gains uneven
  // vertical padding.
  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  p {
    margin: 0 0 6px;
  }

  ul,
  ol {
    margin: 4px 0;
    // Capped so nested lists don't march off the right edge of a 380px drawer.
    padding-left: 18px;
  }

  blockquote {
    margin: 4px 0;
    padding-left: 8px;
    border-left: 2px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.55);
  }

  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 8px 0;
  }

  a {
    color: #f37c22;
    text-decoration: underline;
  }

  code {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 11.5px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 4px;
    padding: 1px 4px;
  }

  .chat-code {
    position: relative;
    margin: 6px 0 0;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;

    pre {
      margin: 0;
      padding: 8px 10px;
    }

    code {
      display: block;
      background: none;
      border: none;
      border-radius: 0;
      padding: 0;
      font-size: 11.5px;
      line-height: 1.55;
      color: #d5d5d8;
      // pre-wrap preserves the code's own line structure, but on its own it
      // will NOT break a 400-character base64 stager — that has no whitespace
      // to break at, so the drawer would still overflow horizontally despite
      // wrapping being on. What makes the never-scroll guarantee hold is the
      // `overflow-wrap: anywhere` inherited from .chat-md; do not "clean that
      // up" out of the root without moving it here.
      white-space: pre-wrap;
    }

    .line {
      display: block;
      // Hanging indent: real lines start at the left edge, wrapped
      // continuations sit indented, so a continuation is visually distinct
      // from a new command.
      padding-left: 22px;
      text-indent: -12px;
    }
  }

  .chat-table {
    overflow-x: auto;
    max-width: 100%;
    margin: 6px 0 0;

    table {
      border-collapse: collapse;
      font-size: 11.5px;

      th,
      td {
        // Not a specificity fight with the root `overflow-wrap: anywhere` —
        // the two never compete, and adding !important here would fix
        // nothing. `nowrap` disables wrapping outright, which leaves
        // overflow-wrap with nothing to act on. Without it a cell wraps
        // mid-word into unreadable slivers instead of letting `.chat-table`
        // scroll, which is the entire point of the scroll container.
        white-space: nowrap;
        padding: 4px 8px;
        border: 1px solid rgba(255, 255, 255, 0.07);
      }

      th {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.85);
        font-weight: 600;
        text-align: left;
      }

      td {
        color: rgba(255, 255, 255, 0.75);
      }
    }
  }

  .chat-code-copy {
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 9px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    border-radius: 4px;
    padding: 2px 6px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .chat-code:hover .chat-code-copy,
  .chat-code-copy:focus-visible {
    opacity: 1;
  }
}
</style>
