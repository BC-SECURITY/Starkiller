// Visual tokens for the stats surfaces (Dashboard + AgentStats + CheckinChart).
// JS constants so chart options can read them directly; the matching CSS
// custom properties live in src/app.scss under .sk-stats-surface.

// Primary terminal/hacker accent (limegreen). Used for big metric numbers.
// WCAG: #32CD32 on Vuetify dark card surface (#212121) ≈ 7.6:1 — passes
// AAA for normal text (≥7:1).
export const ACCENT = "#32CD32";

// Preserves the existing "Vue green" used by the Tasks Over Time line. Kept
// separate from ACCENT so chart series and the limegreen UI accent are
// independently themeable; do not collapse without product approval.
export const TASKS_LINE_COLOR = "#41B883";

export const CHART_PALETTE = [
  TASKS_LINE_COLOR,
  "#E46651",
  "#00D8FF",
  "#DD1B16",
  "#FFCE56",
  "#f87979",
  "#9966FF",
  "#FF9F40",
];

// PALETTE[0] is intentionally TASKS_LINE_COLOR so the aggregate ("All Agents")
// series — colorForSession(null) — keeps the prior Tasks-line visual identity.
// Per-session bars take the hash branch below and derive their color from sid.
export function colorForSession(sid) {
  if (!sid) return CHART_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < sid.length; i += 1) {
    hash = Math.imul(hash, 31) + sid.charCodeAt(i);
  }
  return CHART_PALETTE[Math.abs(hash) % CHART_PALETTE.length];
}

export const CHART_HEIGHT_PX = 350;
