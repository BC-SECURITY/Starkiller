// e2e/docs/scenario.test.js
//
// Validation of the documentation screenshot dataset. This is a VITEST spec
// (.test.js), not a Playwright one, and that is deliberate: every assertion
// here is a synchronous check over a plain object — no browser, no page, no
// dev server. Its earlier home was a @docs-tagged Playwright spec, which meant
// it ran only when someone invoked `pnpm docs:screenshots` by hand and never
// in CI, so an edit to scenario.js could silently break the capture pipeline
// until the next release attempt. Vitest's include list (vite.config.js) picks
// this up, so it now guards every PR — and nothing here pays for the fixture's
// auto-use blockUnmockedApi/consoleGuard launching a browser per assertion.
//
// Playwright's testMatch is "**/*.spec.js", so it does not pick this file up
// and the two runners keep their hard boundary.

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

// The Recent Tasks card on the dashboard renders <agent-tasks-table> with only
// id and task_name hidden, so these are its visible columns. updated_at is the
// one that bites: it is agentTaskConfig's defaultHeader time column AND the
// table's default sort key, and omitting it renders "a few seconds ago" on
// every row (same allowlisted [Vue warn] as the stager case above) rather than
// a blank cell. agent_id additionally backs the row's router-link, which throws
// "Missing required param id" without it.
const REQUIRED_TASK_KEYS = ["agent_id", "status", "username", "updated_at"];

// Visits every string leaf in the dataset, reporting a dotted path so a
// failure names the offending field. The path convention is what makes the
// sweeps below actionable, hence one traversal rather than several.
function walkStrings(node, path, visit) {
  if (typeof node === "string") visit(node, path);
  else if (Array.isArray(node))
    node.forEach((v, i) => walkStrings(v, `${path}[${i}]`, visit));
  else if (node && typeof node === "object")
    Object.entries(node).forEach(([k, v]) =>
      walkStrings(v, `${path}.${k}`, visit),
    );
}

describe("docs scenario", () => {
  // Every check below iterates a collection, and iterating an empty array
  // passes vacuously — an emptied scenario.agents would satisfy "every agent
  // has all required columns" and "every address is RFC 5737" alike. Assert
  // the shape of the dataset itself first so the rest cannot pass by being
  // about nothing.
  it("is populated", () => {
    for (const key of [
      "agents",
      "listeners",
      "listenerTemplates",
      "stagers",
      "modules",
      "malleableProfiles",
      "marketplace",
      "plugins",
      "autorunTasks",
      "notifications",
      "agentFiles",
      "recentTasks",
    ]) {
      expect(Array.isArray(scenario[key]), `${key} is not an array`).toBe(true);
      expect(scenario[key].length, `${key} is empty`).toBeGreaterThan(0);
    }

    // checkinAggregate is an object wrapping `records`, so the loop above and
    // the pagination sweep below (both keyed on Array.isArray) skip it
    // entirely. Checked by hand for the same reason everything else here is:
    // an empty records array leaves CheckinChart's hasData false, the <Bar>
    // unrendered, and the dashboard shot missing its whole bottom card.
    expect(Array.isArray(scenario.checkinAggregate?.records)).toBe(true);
    expect(
      scenario.checkinAggregate.records.length,
      "checkinAggregate.records is empty",
    ).toBeGreaterThan(0);
  });

  it("has no timestamp at or after the frozen instant", () => {
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

  it("populates every default-visible agent column", () => {
    for (const agent of scenario.agents) {
      for (const key of REQUIRED_AGENT_KEYS) {
        expect(agent, `agent ${agent.name} missing ${key}`).toHaveProperty(key);
      }
    }
  });

  it("populates every column the stagers shot renders", () => {
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

  it("populates every column the Recent Tasks card renders", () => {
    for (const task of scenario.recentTasks) {
      for (const key of REQUIRED_TASK_KEYS) {
        expect(task, `task ${task.id} missing ${key}`).toHaveProperty(key);
      }
    }
  });

  it("every recent task names a real scenario agent", () => {
    // Same failure mode as the autorun/module check below: TasksTable's Agent
    // column renders the raw agent_id, so a dangling reference looks IDENTICAL
    // to a matched one in the screenshot. The router-link it builds would only
    // break on click, which a capture never does.
    const sessionIds = scenario.agents.map((a) => a.session_id);
    for (const task of scenario.recentTasks) {
      expect(sessionIds).toContain(task.agent_id);
    }
  });

  it("marks every agent file as a file or a folder", () => {
    // AgentFileBrowser's transform() gives a node `children: []` only on a
    // STRICT is_file === false, and that array is what makes a folder
    // expandable. A missing key or the string "false" renders the folder as a
    // non-expandable leaf — the file browser shot's entire subject — while
    // getByText("Users") still passes. Assert the type, not just presence.
    for (const entry of scenario.agentFiles) {
      expect(typeof entry.is_file, `${entry.name} is_file is not boolean`).toBe(
        "boolean",
      );
      expect(entry, `${entry.name} missing name`).toHaveProperty("name");
      expect(entry, `${entry.name} missing path`).toHaveProperty("path");
    }
    // Both kinds must appear, or the shot stops teaching the distinction.
    expect(scenario.agentFiles.some((e) => e.is_file)).toBe(true);
    expect(scenario.agentFiles.some((e) => !e.is_file)).toBe(true);
  });

  it("keeps every module enabled", () => {
    // AgentExecuteModule only offers enabled modules; a disabled one silently
    // vanishes from the tasking screenshot's picker.
    for (const module of scenario.modules) {
      expect(module.enabled, `module ${module.id} is not enabled`).toBe(true);
    }
  });

  it("keeps every collection within the 10-row pagination limit", () => {
    // The ceiling is the SMALLEST items-per-page any captured view uses, not
    // the most common one. The list views set :items-per-page="15" explicitly
    // (AgentsTable.vue, ListenersTable.vue, StagersTable.vue,
    // ModulesTable.vue, MalleableProfilesList.vue), but Credentials.vue and
    // Tags.vue render a bare <v-data-table> and so take Vuetify's default of
    // 10, and Downloads.vue starts at 10 too. A collection past whichever
    // limit applies to it paginates, hiding rows the screenshot should show —
    // one shared ceiling of 10 keeps that from depending on which view a
    // dataset happens to feed.
    for (const [name, rows] of Object.entries(scenario)) {
      if (Array.isArray(rows)) {
        expect(rows.length, `${name} exceeds one page`).toBeLessThanOrEqual(10);
      }
    }
    // Not a paginated table, so the 10 is arbitrary — but a chart with dozens
    // of buckets renders as unreadable hairlines in a 2880px-wide capture,
    // which is the same "the shot stops showing anything" outcome.
    expect(
      scenario.checkinAggregate.records.length,
      "checkinAggregate.records would crowd the chart",
    ).toBeLessThanOrEqual(10);
  });

  // Starkiller is a public C2 framework: a screenshot must never be mistakable
  // for real infrastructure. Both sweeps below walk the whole dataset rather
  // than named fields, so an address or host added to a new field is covered
  // without anyone remembering to extend this file.
  it("uses only RFC 5737 documentation IP addresses", () => {
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

    const strays = [];
    walkStrings(scenario, "scenario", (value, path) => {
      for (const [ip] of value.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
        if (!ip.startsWith("192.0.2.")) strays.push(`${path}=${ip}`);
      }
    });
    expect(strays).toEqual([]);
  });

  it("uses only documentation-safe hosts in URLs", () => {
    // Require the "://" that makes a value a URL: a plain startsWith("http")
    // also matches non-URL values beginning with the literal string "http"
    // (e.g. the listener name "http-primary").
    const strays = [];
    walkStrings(scenario, "scenario", (value, path) => {
      for (const [, host] of value.matchAll(/\bhttps?:\/\/([^/\s"']+)/g)) {
        if (
          !host.startsWith("192.0.2.") &&
          host !== "example.com" &&
          !host.endsWith(".example.com")
        ) {
          strays.push(`${path}=${host}`);
        }
      }
    });
    expect(strays).toEqual([]);
  });

  it("every autorun task names a real scenario module", () => {
    // AutoRunModules merges each task against availableModules by id. A task
    // naming a module that does not exist falls through to the raw task, which
    // still renders its module_id — so the rendered row looks IDENTICAL to a
    // matched one and no screenshot assertion can catch it. This is the only
    // guard.
    const moduleIds = scenario.modules.map((m) => m.id);
    for (const task of scenario.autorunTasks) {
      expect(moduleIds).toContain(task.module_id);
    }
  });
});
