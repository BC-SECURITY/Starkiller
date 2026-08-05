// e2e/docs/docs.spec.js
//
// Documentation screenshots. Each test MUST assert on rendered scenario content
// before capturing. That assertion is the shape-drift detector: this scenario
// dataset is exercised by nothing else, so without it a renamed component field
// would publish a screenshot of blank cells and still report success.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { test, expect } from "../fixtures/test.js";
import { mockGeneralFormBackground } from "../helpers/network.js";
import { mockListenersList } from "../helpers/api/listeners.js";
import { mockStagersList } from "../helpers/api/stagers.js";
import { mockAgentsList } from "../helpers/api/agents.js";
import { mockModulesList, mockModuleDetail } from "../helpers/api/modules.js";
import { scenario } from "./scenario.js";
import {
  prepareDocsPage,
  mockDocsBackground,
  captureDocsShot,
  countFailedApiResponses,
  tickUntil,
  outputDir,
  emptyOutputDir,
} from "./capture.js";

// Module-scoped state shared across tests, which is safe only because the docs
// project sets workers: 1, fullyParallel: false and retries: 0 (see
// playwright.config.js). Relaxing any of those would silently cross-contaminate
// these or push a duplicate entry per retry.
const results = [];
let apiFailures;

test.describe("documentation screenshots", () => {
  test.beforeAll(async () => {
    // Emptied once per run so a renamed asset cannot leave a stale PNG behind
    // for the publish step to pick up.
    await emptyOutputDir();
  });

  test.beforeEach(async ({ page }) => {
    apiFailures = countFailedApiResponses(page);
    await mockDocsBackground(page);
    await prepareDocsPage(page);
  });

  // Requests consoleGuard so its live errors array can ride along in the same
  // entry as `apiFailures`. consoleGuard is a fixture that does `await
  // use(errors)` and only throws AFTER that — in fixture teardown, which runs
  // after this hook — so reading it here sees whatever has accumulated by the
  // end of the test body plus any afterEach work, same as `apiFailures`.
  test.afterEach(async ({ consoleGuard }, testInfo) => {
    // Push BEFORE asserting: a throwing assertion would otherwise skip this
    // and leave the failed shot absent from result.json instead of recorded
    // as failed, which reads to the publish gate as "nothing wrong".
    // testInfo.status here reflects only the test body's outcome, so a body
    // that passed but hit a failing API response OR raised a page error/console
    // error still records "passed" — that's exactly why `apiFailures` and
    // `consoleErrors` must ride along in the same entry rather than relying
    // on status alone.
    results.push({
      title: testInfo.title,
      status: testInfo.status,
      expectedStatus: testInfo.expectedStatus,
      apiFailures: [...apiFailures],
      consoleErrors: [...consoleGuard],
    });
    expect(
      apiFailures,
      "an /api/v2/ call failed; the screenshot would show empty data",
    ).toEqual([]);
  });

  // The shape written here is a contract consumed by
  // scripts/publish-docs-screenshots.mjs — change both together.
  test.afterAll(async () => {
    // Screenshots are routinely captured mid-iteration, so record whether the
    // tree was dirty as its own field. Without it the publish banner
    // attributes images to a commit that never produced them.
    const starkillerSha = execSync("git rev-parse HEAD", {
      encoding: "utf8",
    }).trim();
    const dirty =
      execSync("git status --porcelain", { encoding: "utf8" }).trim() !== "";
    // require.resolve rather than hand-joining into node_modules, which would
    // assume a flat, non-hoisted layout.
    const { version } = require("@playwright/test/package.json");
    await fs.promises.writeFile(
      path.join(outputDir(), "result.json"),
      JSON.stringify(
        { starkillerSha, dirty, playwrightVersion: version, results },
        null,
        2,
      ),
    );
  });

  test("listeners list @docs", async ({ page }) => {
    await mockListenersList(page, scenario.listeners);
    await page.goto("/#/listeners");
    await expect(page.getByText("http-primary").first()).toBeVisible();
    await expect(page.getByText("smb-pivot").first()).toBeVisible();
    // Second column: options.Host renders in the Host column, distinct from
    // the Name column asserted above — a renamed `options.Host` would
    // otherwise publish a blank cell with a green gate.
    await expect(page.getByText("http://192.0.2.10").first()).toBeVisible();
    await captureDocsShot(page, "listeners_tab.png");
  });

  test("stagers list @docs", async ({ page }) => {
    await mockStagersList(page, scenario.stagers);
    await page.goto("/#/stagers");
    await expect(
      page.getByText("acme-powershell-launcher").first(),
    ).toBeVisible();
    // Second column: `template` renders in the Type column, distinct from the
    // Name column asserted above.
    await expect(page.getByText("multi_launcher").first()).toBeVisible();
    await captureDocsShot(page, "stagers.png");
  });

  test("agents list @docs", async ({ page }) => {
    await mockAgentsList(page, scenario.agents);
    await page.goto("/#/agents");
    // Assert a value from every default-visible column (AgentsTable.vue's
    // defaultHeader entries), so a rename of any one of them shows up as a
    // failure rather than a blank cell in the screenshot. hostname and
    // internal_ip use two different agents than the rest so the same values
    // aren't doing double duty across columns.
    await expect(page.getByText("WIN-DC01").first()).toBeVisible();
    await expect(page.getByText("WIN-FIN03").first()).toBeVisible();
    await expect(page.getByText("ubuntu-web1").first()).toBeVisible();
    await expect(page.getByText("192.0.2.41").first()).toBeVisible();
    // name: web-pivot's `name` differs from its `session_id`
    // (R9TF6NCV), so this specifically exercises the Name column rather than
    // doubling up on a session_id also visible elsewhere.
    await expect(page.getByText("web-pivot").first()).toBeVisible();
    // lastseen_time / checkin_time: DateTimeDisplay renders a relative string
    // off the frozen clock. D2VB5JYK's values (hoursAgo(9) / daysAgo(1)) are
    // unique across the scenario, so these can't accidentally match another
    // row's relative time.
    await expect(page.getByText("9 hours ago").first()).toBeVisible();
    await expect(page.getByText("a day ago").first()).toBeVisible();
    // process_name / username: R9TF6NCV's values.
    await expect(page.getByText("python3").first()).toBeVisible();
    await expect(page.getByText("svc_deploy").first()).toBeVisible();
    // language: exact match — "python" is otherwise a substring of the
    // process_name cell's "python3" in the same row.
    await expect(
      page.getByText("python", { exact: true }).first(),
    ).toBeVisible();
    await captureDocsShot(page, "agents_tab.png");
  });

  test("modules list @docs", async ({ page }) => {
    await mockModulesList(page, scenario.modules);
    await page.goto("/#/modules");
    await expect(
      page.getByText("powershell_situational_awareness_host_processes").first(),
    ).toBeVisible();
    // Second column: `language` renders in the Language column. Exact match —
    // "powershell" is otherwise a substring of the Name column's id string
    // asserted above.
    await expect(
      page.getByText("powershell", { exact: true }).first(),
    ).toBeVisible();
    await captureDocsShot(page, "modules.png");
  });

  test("module multi-agent tasking @docs", async ({ page }) => {
    // GeneralForm.vue fetches agents, listeners, bypasses, malleable-profiles
    // and credentials on mount; without this they hit the 599 sentinel.
    //
    // Order is load-bearing: mockGeneralFormBackground stubs agents with an
    // EMPTY list, and mockAgentsList only wins because Playwright applies
    // routes LIFO. Swap these two lines and the agent picker renders empty
    // with a green gate — nothing reaches the sentinel. Same caveat as
    // e2e/helpers/api/agents.js.
    await mockGeneralFormBackground(page);
    await mockAgentsList(page, scenario.agents);
    await mockModulesList(page, scenario.modules);
    await mockModuleDetail(page, scenario.modules[0]);

    await page.goto(`/#/modules/${scenario.modules[0].id}`);
    await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();

    // Select three agents to show multi-agent tasking. Must be same-language
    // agents: AgentExecuteModule.vue's compatibleModules computed intersects
    // each selected agent's language, and scenario.modules[0] is
    // powershell-only — mixing in a python agent renders a red "No modules are
    // compatible with all selected agents" banner instead of a working demo.
    // The scenario carries 3 powershell agents specifically so a trio of them
    // is possible (see scenario.js). Selected by session_id
    // (not scenario.agents.slice(0, 3)) so this stays correct regardless of
    // array order.
    const taskedAgents = scenario.agents.filter((a) =>
      ["K3H8P2WQ", "M7QX4LZB", "T4LM9XRP"].includes(a.session_id),
    );
    expect(taskedAgents).toHaveLength(3);

    // ModuleExecute.vue's v-autocomplete uses item-title="name", so the
    // option label is agent.name (which differs from session_id for
    // "web-pivot" — not selected here, but true generally).
    const agentsField = page.getByPlaceholder("Agents");
    // Captured now, before any selection: VAutocomplete only renders
    // `placeholder` while the field is empty (`isDirty ? undefined :
    // props.placeholder` in VAutocomplete's render), so getByPlaceholder
    // stops resolving the instant the first chip lands. aria-controls
    // itself is unaffected by that — it's merged onto the same input from a
    // separate prop set — so grabbing it here and reusing the id string
    // later is what keeps the overlay lookup below working post-selection.
    const agentsMenuId = await agentsField.getAttribute("aria-controls");
    expect(
      agentsMenuId,
      "VAutocomplete no longer exposes aria-controls; the overlay lookup below " +
        "would silently resolve to #null",
    ).toBeTruthy();
    await agentsField.click();
    // Measured: 0 rendered <option> elements immediately after the click, 3
    // once the clock ticks — the item list is an rAF-driven virtual scroller.
    await tickUntil(
      page,
      async () => (await page.getByRole("option").count()) > 0,
    );
    for (const agent of taskedAgents) {
      await page.getByRole("option", { name: agent.name }).click();
    }
    await page.keyboard.press("Escape");
    // Assert the LOGICAL close before the visual one. "v-overlay--active" is
    // applied straight off VOverlay's isActive computed with no transition
    // involved, so it flips immediately and cannot be confused with a menu
    // that is merely still fading. Scoped to this autocomplete's own overlay
    // via aria-controls so a future shot with a legitimately-visible overlay
    // isn't caught by a copy-pasted selector.
    const agentsOverlay = page.locator(`#${agentsMenuId}`);
    await expect(agentsOverlay).not.toHaveClass(/v-overlay--active/);
    // Then let the content element actually reach display:none — its
    // <Transition> leave hook is rAF-driven, so it needs the clock too.
    const agentsMenu = agentsOverlay.locator(".v-overlay__content");
    await tickUntil(page, () => agentsMenu.isHidden());

    for (const agent of taskedAgents) {
      await expect(page.getByText(agent.session_id).first()).toBeVisible();
    }
    await expect(
      page.getByText(/no modules are compatible/i),
    ).not.toBeVisible();
    await captureDocsShot(page, "multi_agent_tasking.png");
  });
});
