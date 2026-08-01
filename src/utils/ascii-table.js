import { stripAnsi } from "@/utils/ansi";

// Shared box-drawing border so the only consumer (AgentTerminal.vue) and the
// spec stay in sync — drift between the two would let the byte-for-byte spec
// pass against its own copy while production renders differently. Frozen so a
// Vue reactivity proxy can't silently mutate the underlying singleton through
// `this.tableConfig.border.X = ...`; a stray mutation now throws loudly under
// strict mode instead of poisoning every subsequent render.
export const BOX_BORDER = Object.freeze({
  topBody: "─",
  topJoin: "┬",
  topLeft: "┌",
  topRight: "┐",

  bottomBody: "─",
  bottomJoin: "┴",
  bottomLeft: "└",
  bottomRight: "┘",

  bodyLeft: "│",
  bodyRight: "│",
  bodyJoin: "│",

  joinBody: "─",
  joinLeft: "├",
  joinRight: "┤",
  joinJoin: "┼",
});

// Minimal box-drawing ASCII table renderer covering the call shape used by
// AgentTerminal.vue (the only consumer of the `table` package this replaces).
//
// Supported config: `border` (full set of corner/edge/join chars, no defaults
// — pass them all) and per-column `columns[i].width`. Behavior matches the
// `table` package for our call sites:
//   - 1 space of inner padding on each side of every cell
//   - column width = configured width if set, else max display width of any
//     cell in that column (ANSI codes don't count toward display width)
//   - rows wider than the column width wrap mid-character (NOT word-wrapped)
//   - a horizontal separator is drawn between every pair of rows
//   - output ends with a trailing newline
//
// Not supported (because we don't use it): paddingLeft/paddingRight,
// alignment, drawHorizontalLine callbacks, header/border-less modes, or
// wrapping that preserves ANSI styling across split points. If a future call
// site needs any of those, extend here rather than reaching back for `table`.

function displayWidth(s) {
  return stripAnsi(String(s)).length;
}

// Width of the widest single line in a (possibly multi-line) cell. Used for
// auto-sizing so that "one\ntwo" sizes as 3 (widest sub-line) rather than 7.
function maxSubLineWidth(s) {
  let max = 0;
  for (const line of String(s).split("\n")) {
    const w = displayWidth(line);
    if (w > max) max = w;
  }
  return max;
}

function wrapToWidth(s, width) {
  const str = String(s);
  // Guard width <= 0 — slice(i, i+0) never advances and would spin forever.
  if (width <= 0) return [str];
  // Honor embedded newlines as forced line breaks (matches the `table`
  // package). Then wrap each segment mid-character to fit the column width —
  // plain-char wrap is acceptable because the codebase's only wrapped cells
  // are plain (uncolored) descriptions; ANSI-bearing cells are short
  // (e.g. colorized headers) and never exceed their column width.
  const out = [];
  for (const segment of str.split("\n")) {
    if (displayWidth(segment) <= width) {
      out.push(segment);
    } else {
      for (let i = 0; i < segment.length; i += width) {
        out.push(segment.slice(i, i + width));
      }
    }
  }
  return out;
}

function coerceCell(cell) {
  if (cell == null) return "";
  if (
    typeof cell !== "string" &&
    typeof cell !== "number" &&
    typeof cell !== "boolean"
  ) {
    // Loud rather than silent — upstream `table` threw on non-primitives.
    console.warn(
      "ascii-table: non-primitive cell coerced to string; this likely indicates a contract regression in the caller's data shape",
      cell,
    );
  }
  return String(cell);
}

function padRight(s, width) {
  const gap = width - displayWidth(s);
  return gap > 0 ? s + " ".repeat(gap) : s;
}

export function table(rows, { border, columns = {} } = {}) {
  if (rows.length === 0) return "";
  const ncols = rows[0].length;

  // Validate row shape loudly — upstream `table` threw on mismatch. Without
  // this, extra cells get silently truncated and missing cells silently
  // pad with "".
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== ncols) {
      throw new Error(
        `ascii-table: row ${i} has ${rows[i].length} cells, expected ${ncols} (from row 0)`,
      );
    }
  }

  const widths = [];
  for (let c = 0; c < ncols; c++) {
    if (columns[c]?.width != null) {
      widths.push(columns[c].width);
    } else {
      let max = 0;
      for (const row of rows)
        max = Math.max(max, maxSubLineWidth(row[c] ?? ""));
      widths.push(max);
    }
  }

  const hLine = (left, mid, join, right) =>
    left + widths.map((w) => mid.repeat(w + 2)).join(join) + right;
  const top = hLine(
    border.topLeft,
    border.topBody,
    border.topJoin,
    border.topRight,
  );
  const between = hLine(
    border.joinLeft,
    border.joinBody,
    border.joinJoin,
    border.joinRight,
  );
  const bottom = hLine(
    border.bottomLeft,
    border.bottomBody,
    border.bottomJoin,
    border.bottomRight,
  );

  const renderRow = (row) => {
    const cells = row.map((cell, c) =>
      wrapToWidth(coerceCell(cell), widths[c]),
    );
    const subRowCount = Math.max(...cells.map((lines) => lines.length));
    const out = [];
    for (let sr = 0; sr < subRowCount; sr++) {
      const parts = cells.map((lines, c) => {
        const line = lines[sr] ?? "";
        return ` ${padRight(line, widths[c])} `;
      });
      out.push(
        border.bodyLeft + parts.join(border.bodyJoin) + border.bodyRight,
      );
    }
    return out;
  };

  const lines = [top];
  rows.forEach((row, idx) => {
    lines.push(...renderRow(row));
    if (idx < rows.length - 1) lines.push(between);
  });
  lines.push(bottom);
  return `${lines.join("\n")}\n`;
}
