// eslint-disable-next-line import/no-named-default
import { default as AnsiUp } from "ansi_up";

// from https://github.com/xpl/ansicolor
export function stripAnsi(text) {
  return text.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g,
    "",
  ); // hope V8 caches the regexp
}

export function isAnsi(output) {
  return stripAnsi(output) !== output;
}

export function ansiToHtml(output) {
  return new AnsiUp().ansi_to_html(output);
}

// Re-exported for the few call sites that intentionally reuse a single
// stateful AnsiUp instance across calls (e.g. AgentJobs) rather than the
// per-call `new AnsiUp()` semantics of ansiToHtml above.
export { AnsiUp };

// ANSI color codes for the interactive-console prompts (AgentTerminal,
// AgentShellSession). Returns `text` unchanged for an unrecognized color.
export function colorizeText(text, color = "") {
  const ansiColors = {
    red: "\u001b[91m",
    green: "\u001b[92m",
    blue: "\u001b[94m",
    yellow: "\u001b[93m",
    white: "\u001b[97m",
  };
  const colorCode = ansiColors[color.toLowerCase()];
  if (!colorCode) return text;
  return `\u001b[1m${colorCode}${text}\u001b[0m`;
}
