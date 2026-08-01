import { describe, it, expect, vi, afterEach } from "vitest";
import { renderChatMessage } from "@/utils/chat-markdown";

describe("renderChatMessage — escaping", () => {
  it("escapes raw HTML instead of injecting it", () => {
    const html = renderChatMessage("hi <script>alert(1)</script> there");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes raw HTML attributes that could break out of a tag", () => {
    const html = renderChatMessage('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("renderChatMessage — inline formatting", () => {
  it("renders bold, italic, strikethrough and inline code", () => {
    const html = renderChatMessage("**b** _i_ ~~s~~ `c`");
    expect(html).toContain("<strong>b</strong>");
    expect(html).toContain("<em>i</em>");
    expect(html).toContain("<s>s</s>");
    expect(html).toContain("<code>c</code>");
  });

  it("renders bullet and numbered lists", () => {
    const html = renderChatMessage("- one\n- two\n\n1. a\n2. b");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<ol>");
  });

  it("renders blockquotes", () => {
    const html = renderChatMessage("> quoted");
    expect(html).toContain("<blockquote>");
  });

  it("treats a single newline as a line break", () => {
    const html = renderChatMessage("line1\nline2");
    expect(html).toContain("<br>");
  });
});

describe("renderChatMessage — disabled subset", () => {
  it("does not render headings", () => {
    const html = renderChatMessage("# Big\n\ntext");
    expect(html).not.toContain("<h1");
    expect(html).toContain("# Big");
  });

  it("does not render setext headings", () => {
    const html = renderChatMessage("Title\n---\n\ntext");
    expect(html).not.toContain("<h2");
  });
});

describe("renderChatMessage — tables", () => {
  it("renders a table wrapped in a scroll container", () => {
    const html = renderChatMessage("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain("<table");
    expect(html).toContain('<div class="chat-table"><table');
  });

  it("renders table header and body cell content", () => {
    const html = renderChatMessage(
      "| Name | Value |\n| --- | --- |\n| foo | bar |",
    );
    expect(html).toContain("<th>Name</th>");
    expect(html).toContain("<th>Value</th>");
    expect(html).toContain("<td>foo</td>");
    expect(html).toContain("<td>bar</td>");
  });

  // The table_open/table_close overrides only touch the wrapper markup
  // (adding the .chat-table scroll container); they don't touch cell
  // rendering. This pins that cell content still goes through markdown-it's
  // normal escaping and a table can't be used to smuggle raw HTML.
  it("escapes a script tag inside a table cell instead of injecting it", () => {
    const html = renderChatMessage(
      "| a |\n| --- |\n| <script>alert(1)</script> |",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("renderChatMessage — backslash escaping is disabled", () => {
  // Windows and UNC paths are pasted constantly in a C2 chat. Markdown's
  // `escape` rule treats a backslash before ASCII punctuation as an escape
  // character and silently drops it, corrupting the path. These pin that
  // each of the verified corruption cases now survives intact.
  it("preserves a UNC path's leading backslash", () => {
    const html = renderChatMessage("\\\\10.10.14.7\\share\\payload.dll");
    expect(html).toContain("\\\\10.10.14.7\\share\\payload.dll");
  });

  it("preserves the dot in a dotfile path", () => {
    const html = renderChatMessage("C:\\temp\\.hidden");
    expect(html).toContain("C:\\temp\\.hidden");
  });

  it("preserves the asterisk in a wildcard path", () => {
    const html = renderChatMessage("C:\\temp\\*.log");
    expect(html).toContain("C:\\temp\\*.log");
  });

  it("preserves the underscore in a path", () => {
    const html = renderChatMessage("C:\\temp\\_private");
    expect(html).toContain("C:\\temp\\_private");
  });
});

describe("renderChatMessage — images are neutered", () => {
  it("renders an image as its alt text with no img tag", () => {
    const html = renderChatMessage("![alt text](https://evil.example/t.png)");
    expect(html).not.toContain("<img");
    expect(html).toContain("alt text");
  });

  // Regression test for the trap this design specifically avoids: simply
  // disabling markdown-it's `image` rule leaves "!" as literal text and still
  // parses [alt](url) as a link, resurfacing the attacker-controlled URL as a
  // clickable target. The URL must not appear anywhere in the output.
  it("does not leak the image URL as a link or as text", () => {
    const html = renderChatMessage("![alt](https://evil.example/track.png)");
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("<a ");
  });

  // The security property the code actually guarantees is narrower than "the
  // URL never appears anywhere": alt text is emitted as escaped plain text,
  // so a URL written inside the alt text does survive as text. What must
  // hold is that it never becomes a clickable anchor or an <img> request.
  it("passes a URL inside the alt text through as text but never as a link or image", () => {
    const html = renderChatMessage(
      "![see [x](https://evil.example/nested)](https://good.example/y.png)",
    );
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<img");
    expect(html).toContain("https://evil.example/nested");
  });

  it("escapes alt text", () => {
    const html = renderChatMessage('![say "hi" <b>](https://e.example/a.png)');
    expect(html).toContain("&quot;hi&quot;");
    expect(html).not.toContain("<b>");
  });
});

describe("renderChatMessage — link hardening", () => {
  it("hardens explicit links", () => {
    const html = renderChatMessage("[docs](https://example.com/a?b=1)");
    expect(html).toContain('href="https://example.com/a?b=1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  it("linkifies a bare URL with the same hardening", () => {
    const html = renderChatMessage("see https://example.com now");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  it("refuses javascript: URLs", () => {
    const html = renderChatMessage("[click](javascript:alert(1))");
    expect(html).not.toContain("<a ");
  });

  it("refuses data: URLs", () => {
    const html = renderChatMessage("[click](data:text/html,<b>x</b>)");
    expect(html).not.toContain("<a ");
  });

  it("refuses mailto: URLs", () => {
    const html = renderChatMessage("[mail](mailto:a@example.com)");
    expect(html).not.toContain("<a ");
  });

  // The explicit-URL linkify test above only covers a URL that already spells
  // out `https://`. linkify-it separately auto-detects bare hostnames
  // ("fuzzy link" matching), which is a completely different code path and
  // needs its own coverage: operators paste bare hostnames like this
  // constantly.
  it("hardens a fuzzy-linked bare hostname the same as an explicit link", () => {
    const html = renderChatMessage("beacon to c2.evil.com:443/beacon now");
    expect(html).toContain('href="http://c2.evil.com:443/beacon"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  // Mirrors the mailto test above but through linkify-it's separate
  // `fuzzyEmail` auto-detection of a bare address with no explicit `mailto:`
  // or link syntax. This is the same security property ("no mailto anchors")
  // reached via an entirely untested parser path.
  it("does not linkify a bare, fuzzy-detected email address", () => {
    const html = renderChatMessage("contact foo@example.com now");
    expect(html).not.toContain("<a ");
    expect(html).toContain("foo@example.com");
  });
});

describe("renderChatMessage — input handling", () => {
  it("returns empty output for empty and whitespace-only input", () => {
    expect(renderChatMessage("")).toBe("");
    expect(renderChatMessage("   ")).toBe("");
  });

  // A nullish payload is malformed, not a legitimate empty message: both call
  // sites are guarded to type === "text", and a system message renders its own
  // text without coming through here. It still renders as an empty bubble —
  // there is nothing else it could render as — so the log is the only signal
  // that a chat/message arrived with no `message` field at all.
  it("renders empty output for null/undefined but logs that it happened", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(renderChatMessage(null)).toBe("");
    expect(renderChatMessage(undefined)).toBe("");

    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Starkiller]"),
      null,
    );
    errorSpy.mockRestore();
  });

  // Regression test: a non-string, non-nullish payload (number, object,
  // array, boolean) must render visibly rather than silently producing a
  // blank bubble — see the module's own "silently dropping an operator's
  // message is the worst outcome" comment. Before the fix, `typeof text ===
  // "string" ? text : ""` coerced all of these to an empty string.
  it("coerces non-string, non-nullish input to visible text instead of blanking it", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(renderChatMessage(42)).toContain("42");
    expect(renderChatMessage(true)).toContain("true");
    expect(renderChatMessage(["x"])).toContain("x");
    expect(renderChatMessage({ foo: "bar" })).toContain("object");

    errorSpy.mockRestore();
  });

  it("logs an error when non-string input is coerced", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderChatMessage(42);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Starkiller]"),
      42,
    );

    errorSpy.mockRestore();
  });
});

describe("renderChatMessage — parse failure degrades instead of blanking", () => {
  afterEach(() => {
    vi.doUnmock("markdown-it");
    vi.resetModules();
  });

  // Forces the try/catch's actual catch branch (not the input-coercion path
  // above, which never reaches it) by stubbing markdown-it's render() to
  // throw. Uses vi.doMock + a dynamic re-import because the render() call is
  // internal to the module's shared `md` instance and not reachable any other
  // way from outside.
  it("returns escaped plain text rather than throwing or blanking when md.render throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("markdown-it", () => ({
      default: class FakeMarkdownIt {
        constructor() {
          this.renderer = { rules: {} };
          this.utils = {
            escapeHtml: (s) =>
              String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;"),
          };
        }
        disable() {}
        render() {
          throw new Error("simulated markdown-it parse failure");
        }
      },
    }));

    const { renderChatMessage: renderWithBrokenParser } = await import(
      "@/utils/chat-markdown"
    );

    const result = renderWithBrokenParser("hi <b>there</b>");

    expect(result).toBe("hi &lt;b&gt;there&lt;/b&gt;");
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe("renderChatMessage — hr", () => {
  // `hr` is deliberately left enabled (see the comment in chat-markdown.js);
  // nothing else pins that a bare `---` line actually renders one.
  it("renders a horizontal rule for a bare '---' line", () => {
    const html = renderChatMessage("before\n\n---\n\nafter");
    expect(html).toContain("<hr>");
  });
});

describe("renderChatMessage — code blocks", () => {
  it("renders a fenced block with one line span per source line", () => {
    const html = renderChatMessage("```\nfirst line\nsecond line\n```");
    expect(html).toContain('<span class="line">first line</span>');
    expect(html).toContain('<span class="line">second line</span>');
  });

  it("wraps a fenced block in the copy container with a copy button", () => {
    const html = renderChatMessage("```\nfoo\n```");
    expect(html).toContain('class="chat-code"');
    expect(html).toContain('class="chat-code-copy"');
    expect(html).toContain('aria-label="Copy code"');
  });

  it("renders an indented block as code so pasted output keeps its alignment", () => {
    const html = renderChatMessage("    col1  col2\n    a     b");
    expect(html).toContain('<span class="line">col1  col2</span>');
  });

  it("escapes HTML inside a code block", () => {
    const html = renderChatMessage("```\n<script>alert(1)</script>\n```");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("ignores the language info string rather than emitting a class", () => {
    const html = renderChatMessage("```powershell\nfoo\n```");
    expect(html).not.toContain("language-powershell");
  });

  // The copy button reads data-code, so this attribute is what the operator
  // actually gets on the clipboard. It is deliberately NOT a byte-for-byte
  // copy of the input (see the exception list in chat-markdown.js), but it
  // must survive quotes, ampersands, angle brackets and newlines intact.
  // Reconstructing the source from the line spans instead would be wrong:
  // textContent concatenates them with no separator.
  it("round-trips the raw source in data-code including quotes and newlines", () => {
    const html = renderChatMessage('```\nsay "hi" & <bye>\nsecond\n```');
    expect(html).toContain(
      'data-code="say &quot;hi&quot; &amp; &lt;bye&gt;\nsecond"',
    );
  });

  it("does not leave a trailing newline in data-code", () => {
    const html = renderChatMessage("```\nonly\n```");
    expect(html).toContain('data-code="only"');
  });

  // The line above strips the block's *terminator*, not content: a blank line
  // an operator deliberately left inside a fence still round-trips. Pinned
  // because the two look identical from the regex alone.
  it("keeps a deliberate trailing blank line inside a fence", () => {
    const html = renderChatMessage("```\nfoo\n\n```");
    expect(html).toContain('data-code="foo\n"');
  });

  // Documented divergence from byte-exactness: markdown-it strips the
  // four-space indent before the renderer sees the content, so an indented
  // block copies as the code itself rather than as the markdown that produced
  // it. That is the useful behavior, but it is a divergence — pin it so the
  // exception list in chat-markdown.js stays honest.
  it("copies an indented block without its markdown indentation", () => {
    const html = renderChatMessage("    col1  col2\n    a     b");
    expect(html).toContain('data-code="col1  col2\na     b"');
  });
});
