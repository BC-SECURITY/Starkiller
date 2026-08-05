// Imports @playwright/test directly rather than ../fixtures/test.js on
// purpose: these are synchronous assertions over a plain object, and the
// fixture's auto-use blockUnmockedApi/consoleGuard would launch a browser for
// every one of them.
import { test, expect } from "@playwright/test";
import { FROZEN_TIME, scenario } from "./scenario.js";

// AgentsTable.vue marks these headers defaultHeader: true, so every one of them
// is a visible column in the /#/agents screenshot. A missing key renders blank.
// Tags is deliberately absent: AgentsTable.vue declares its Tags header WITHOUT
// defaultHeader, so Starkiller hides that column until an operator adds it, and
// a docs screenshot should show the default UI. `actions` is likewise absent —
// it is a control column with no backing scenario field.
const REQUIRED_AGENT_KEYS = [
  "name",
  "lastseen_time",
  "checkin_time",
  "hostname",
  "process_name",
  "language",
  "username",
  "internal_ip",
];

// StagersTable hides other users' stagers under filterOnlyMyStagers, and a
// missing created_at makes DateTimeDisplay's fromNow() resolve undefined to
// "a few seconds ago" behind an allowlisted [Vue warn] — both render a wrong
// or empty screenshot with nothing failing. See scenario.js.
const REQUIRED_STAGER_KEYS = ["name", "template", "user_id", "created_at"];

// Visits every string leaf in the dataset, reporting a dotted path so a
// failure names the offending field. The path convention is what makes both
// sweeps below actionable, hence one traversal rather than two.
function walkStrings(node, path, visit) {
  if (typeof node === "string") visit(node, path);
  else if (Array.isArray(node))
    node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
  else if (node && typeof node === "object")
    Object.entries(node).forEach(([k, v]) =>
      walkStrings(v, `${path}.${k}`, visit),
    );
}

// These tests are tagged @docs, so they run only via `pnpm docs:screenshots`
// (--grep @docs) — NOT under `pnpm test:e2e` or CI. Editing scenario.js without
// re-running docs:screenshots will not surface a regression here.
test.describe("docs scenario", () => {
  test("has no timestamp at or after the frozen instant @docs", () => {
    // A timestamp in the future renders as "in 3 months" via dayjs fromNow().
    const future = [];
    let seen = 0;
    walkStrings(scenario, "scenario", (value, path) => {
      if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return;
      seen += 1;
      if (new Date(value) >= FROZEN_TIME) future.push(`${path}=${value}`);
    });
    // Without a floor this passes vacuously: strip every timestamp from the
    // dataset, or switch one to epoch millis, and `future` stays empty while
    // the screenshots regress to "a few seconds ago" everywhere.
    expect(
      seen,
      "the timestamp walk matched nothing — check the format regex",
    ).toBeGreaterThanOrEqual(12);
    expect(future).toEqual([]);
  });

  test("populates every default-visible agent column @docs", () => {
    for (const agent of scenario.agents) {
      for (const key of REQUIRED_AGENT_KEYS) {
        expect(agent, `agent ${agent.name} missing ${key}`).toHaveProperty(key);
      }
    }
  });

  test("keeps every collection within the 15-row pagination limit @docs", () => {
    for (const [name, rows] of Object.entries(scenario)) {
      if (Array.isArray(rows)) {
        expect(rows.length, `${name} exceeds one page`).toBeLessThanOrEqual(15);
      }
    }
  });

  test("uses only RFC 5737 documentation addresses @docs", () => {
    for (const agent of scenario.agents) {
      expect(agent.internal_ip).toMatch(/^192\.0\.2\./);
      expect(agent.external_ip).toMatch(/^192\.0\.2\./);
    }
    // Looked up rather than looped over with an if-guard: the listeners shot
    // asserts this Host renders, so its absence must fail here instead of
    // silently skipping. smb listeners have no Host by design (they use
    // PipeName), which is why this targets the http one.
    const http = scenario.listeners.find((l) => l.listener_type === "http");
    expect(http?.options.Host, "no http listener carries a Host").toBeTruthy();
    expect(http.options.Host).toMatch(/^https?:\/\/192\.0\.2\./);

    // Generic sweep so a real address can't ride in on a field nobody thought
    // to enumerate. These screenshots ship in a public C2 framework's docs.
    const strays = [];
    walkStrings(scenario, "scenario", (value, path) => {
      for (const [ip] of value.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
        if (!ip.startsWith("192.0.2.")) strays.push(`${path}=${ip}`);
      }
    });
    expect(strays).toEqual([]);
  });

  test("populates every column the stagers shot renders @docs", () => {
    for (const stager of scenario.stagers) {
      for (const key of REQUIRED_STAGER_KEYS) {
        expect(stager, `stager ${stager.name} missing ${key}`).toHaveProperty(
          key,
        );
      }
      // StagersTable filters on user_id === userId under onlyMyStagers, and
      // setFakeAuth authenticates as user 1.
      expect(stager.user_id).toBe(1);
    }
  });

  test("keeps every module enabled @docs", () => {
    // AgentExecuteModule only offers enabled modules; a disabled one silently
    // vanishes from the tasking screenshot's picker.
    for (const module of scenario.modules) {
      expect(module.enabled, `module ${module.id} is not enabled`).toBe(true);
    }
  });
});
