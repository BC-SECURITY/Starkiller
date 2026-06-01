import { table, BOX_BORDER as border } from "@/utils/ascii-table";

// Golden values captured from the previously-used `table` package (`table@^6.8.1`,
// the version pinned in `package.json` before this PR removed it) against these
// same inputs. If you change the renderer and the captures here no longer match
// what `table` would have produced, recapture against the upstream package at
// that major version before updating them.

describe("table", () => {
  it("renders the AgentTerminal help table identically to the `table` package", () => {
    const config = { border, columns: { 1: { width: 40 }, 2: { width: 40 } } };
    const rows = [
      ["Command", "Description", "Usage"],
      ["help", "Display the help menu for the current menu", "help"],
      ["clear", "Clear the terminal output", "clear"],
      [
        "shell",
        "Tasks the specified agent to execute a shell command",
        "shell [--literal / -l] <shell_cmd>",
      ],
    ];
    const expected =
      "┌─────────┬──────────────────────────────────────────┬──────────────────────────────────────────┐\n" +
      "│ Command │ Description                              │ Usage                                    │\n" +
      "├─────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤\n" +
      "│ help    │ Display the help menu for the current me │ help                                     │\n" +
      "│         │ nu                                       │                                          │\n" +
      "├─────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤\n" +
      "│ clear   │ Clear the terminal output                │ clear                                    │\n" +
      "├─────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤\n" +
      "│ shell   │ Tasks the specified agent to execute a s │ shell [--literal / -l] <shell_cmd>       │\n" +
      "│         │ hell command                             │                                          │\n" +
      "└─────────┴──────────────────────────────────────────┴──────────────────────────────────────────┘\n";
    expect(table(rows, config)).toBe(expected);
  });

  it("renders the AgentTerminal module-options table identically", () => {
    const config = {
      border,
      columns: { 1: { width: 20 }, 2: { width: 8 }, 3: { width: 40 } },
    };
    const rows = [
      ["Option Name", "Value", "Required", "Description"],
      ["Listener", "http", "True", "Listener to use."],
      [
        "BypassesString",
        "mattifestation@1@2@3@4@5",
        "True",
        'Bypasses to apply, separated by space, in order. Use "none" to clear.',
      ],
    ];
    const expected =
      "┌────────────────┬──────────────────────┬──────────┬──────────────────────────────────────────┐\n" +
      "│ Option Name    │ Value                │ Required │ Description                              │\n" +
      "├────────────────┼──────────────────────┼──────────┼──────────────────────────────────────────┤\n" +
      "│ Listener       │ http                 │ True     │ Listener to use.                         │\n" +
      "├────────────────┼──────────────────────┼──────────┼──────────────────────────────────────────┤\n" +
      "│ BypassesString │ mattifestation@1@2@3 │ True     │ Bypasses to apply, separated by space, i │\n" +
      '│                │ @4@5                 │          │ n order. Use "none" to clear.            │\n' +
      "└────────────────┴──────────────────────┴──────────┴──────────────────────────────────────────┘\n";
    expect(table(rows, config)).toBe(expected);
  });

  it("auto-sizes columns to the widest visible cell when no width is set", () => {
    const expected =
      "┌──────┬─────┐\n" +
      "│ Name │ Qty │\n" +
      "├──────┼─────┤\n" +
      "│ A    │ 1   │\n" +
      "├──────┼─────┤\n" +
      "│ Foo  │ 100 │\n" +
      "└──────┴─────┘\n";
    expect(
      table(
        [
          ["Name", "Qty"],
          ["A", "1"],
          ["Foo", "100"],
        ],
        { border },
      ),
    ).toBe(expected);
  });

  it("treats ANSI codes as zero-width when sizing columns", () => {
    const green = "\x1b[32mgreen\x1b[39m";
    const expected =
      "┌──────────┬──────────┐\n" +
      `│ ${green}    │ right    │\n` +
      "├──────────┼──────────┤\n" +
      "│ row2col1 │ row2col2 │\n" +
      "└──────────┴──────────┘\n";
    expect(
      table(
        [
          [green, "right"],
          ["row2col1", "row2col2"],
        ],
        { border },
      ),
    ).toBe(expected);
  });

  it("returns an empty string for an empty input", () => {
    expect(table([], { border })).toBe("");
  });

  it("throws on row-length mismatch instead of silently dropping/padding cells", () => {
    expect(() =>
      table(
        [
          ["A", "B"],
          ["a", "b", "c"],
        ],
        { border },
      ),
    ).toThrow(/row 1 has 3 cells, expected 2/);
    expect(() => table([["A", "B"], ["a"]], { border })).toThrow(
      /row 1 has 1 cells, expected 2/,
    );
  });

  it("honors embedded newlines as forced line breaks (matches `table`)", () => {
    const expected =
      "┌──────┬───────┐\n" +
      "│ Name │ Notes │\n" +
      "├──────┼───────┤\n" +
      "│ A    │ one   │\n" +
      "│      │ two   │\n" +
      "└──────┴───────┘\n";
    expect(
      table(
        [
          ["Name", "Notes"],
          ["A", "one\ntwo"],
        ],
        { border },
      ),
    ).toBe(expected);
  });

  it("does not hang when a column width is 0", () => {
    // Regression guard: `for (i = 0; i < str.length; i += 0)` would spin
    // forever without the wrapToWidth width<=0 guard.
    const out = table(
      [
        ["A", "B"],
        ["x", "y"],
      ],
      { border, columns: { 0: { width: 0 } } },
    );
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("warns when a cell is a non-primitive instead of silently rendering '[object Object]'", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      table(
        [
          ["A", "B"],
          ["x", { unexpected: "object" }],
        ],
        { border },
      );
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toMatch(/non-primitive cell/);
    } finally {
      spy.mockRestore();
    }
  });
});
