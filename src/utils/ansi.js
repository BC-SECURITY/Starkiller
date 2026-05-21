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
