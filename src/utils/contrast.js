// Pick a readable text color (black or white) to place on top of `bgColor`.
// A flat v-chip paints its background with the tag color but does NOT contrast
// its own text, so pale colors (e.g. yellow) would render unreadable white-on-
// light without this. Uses the YIQ perceived-brightness formula and accepts
// #rgb, #rrggbb, or #rrggbbaa (alpha ignored); falls back to white for a
// missing or unparseable color.
export function readableTextColor(bgColor) {
  const hex = String(bgColor || "").replace("#", "");
  const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return Number.isNaN(brightness) || brightness < 150 ? "#ffffff" : "#000000";
}
