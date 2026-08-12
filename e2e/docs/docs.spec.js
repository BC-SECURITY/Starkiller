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
import {
  mockListenersList,
  mockListenerDetail,
  mockListenerTemplates,
  mockListenerTemplate,
  mockAutorunTasks,
} from "../helpers/api/listeners.js";
import {
  mockStagersList,
  mockStagerDetail,
  mockStagerTemplates,
  mockStagerTemplate,
} from "../helpers/api/stagers.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  mockAgentDirectory,
  mockDashboardOnlyEndpoints,
  mockCheckinsAggregate,
  mockAgentTasksFeed,
} from "../helpers/api/agents.js";
import {
  mockMalleableProfilesList,
  mockMalleableProfileDetail,
} from "../helpers/api/malleable.js";
import { mockBypassesList, mockBypassDetail } from "../helpers/api/bypasses.js";
import { mockModulesList, mockModuleDetail } from "../helpers/api/modules.js";
import {
  mockInstalledPlugins,
  mockPluginMarketplace,
  mockPluginDetail,
  mockPluginTasks,
} from "../helpers/api/plugins.js";
import { seedNotifications } from "../helpers/api/notifications.js";
import { mockCredentialsList } from "../helpers/api/credentials.js";
import { mockDownloadsList } from "../helpers/api/downloads.js";
import { mockTagsRegistry } from "../helpers/api/tags.js";
import { mockUsersList } from "../helpers/api/users.js";
import { seedAdmin } from "../helpers/auth.js";
import {
  mockObfuscationKeywords,
  mockObfuscationGlobal,
} from "../helpers/api/obfuscation.js";
import { scenario } from "./scenario.js";
import {
  prepareDocsPage,
  mockDocsBackground,
  gotoDocs,
  captureDocsShot,
  closeDocsOverlay,
  tickUntil,
  tickUntilSized,
  tickUntilTabStripSized,
  countFailedApiResponses,
  outputDir,
  emptyOutputDir,
  resetCapturedShots,
  capturedShots,
} from "./capture.js";

// Module-scoped state shared across tests, which is safe only because the docs
// project sets workers: 1, fullyParallel: false and retries: 0 (see
// playwright.config.js). Relaxing any of those would silently cross-contaminate
// these or push a duplicate entry per retry.
const results = [];
// Initialised, not left undefined: afterEach spreads this into the recorded
// entry, and if a fixture fails setup before this describe's beforeEach runs,
// afterEach still fires. A bare `let` would make that spread throw, skipping
// the push entirely — the exact "absent from result.json instead of recorded"
// outcome the push-before-assert ordering below exists to prevent. Reassigned
// per test in beforeEach, so this value is only ever the fallback.
let apiFailures = [];

test.describe("documentation screenshots", () => {
  test.beforeAll(async () => {
    // Emptied once per run so a renamed asset cannot leave a stale PNG behind
    // for the publish step to pick up.
    await emptyOutputDir();
  });

  test.beforeEach(async ({ page }) => {
    // Reset per test so this test's result.json entry records exactly the
    // filenames IT captured — some tests call captureDocsShot more than
    // once (see the obfuscation test below), so a per-run image count alone
    // can't distinguish a legitimate multi-shot test from a stale file.
    resetCapturedShots();
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
    // Push BEFORE asserting: a throwing assertion would otherwise leave the
    // failed shot absent from result.json rather than recorded as failed, which
    // reads to the publish gate as "nothing wrong". testInfo.status reflects
    // only the body's outcome, so a body that passed while hitting a failing
    // API response or a page error still records "passed" — hence `apiFailures`
    // and `consoleErrors` riding along in the same entry.
    results.push({
      title: testInfo.title,
      status: testInfo.status,
      expectedStatus: testInfo.expectedStatus,
      apiFailures: [...apiFailures],
      consoleErrors: [...consoleGuard],
      assets: capturedShots(),
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
    await gotoDocs(page, "/#/listeners");
    await expect(page.getByText("http-primary").first()).toBeVisible();
    await expect(page.getByText("smb-pivot").first()).toBeVisible();
    // A second column, distinct from Name: options.Host renders in the Host
    // column — a renamed `options.Host` would otherwise publish a blank cell
    // with a green gate.
    await expect(page.getByText("http://192.0.2.10").first()).toBeVisible();
    await captureDocsShot(page, "listeners_tab.png");
  });

  test("stagers list @docs", async ({ page }) => {
    await mockStagersList(page, scenario.stagers);
    await gotoDocs(page, "/#/stagers");
    await expect(
      page.getByText("acme-powershell-launcher").first(),
    ).toBeVisible();
    // A second column, distinct from Name: `template` renders in the Type
    // column.
    await expect(page.getByText("multi_launcher").first()).toBeVisible();
    await captureDocsShot(page, "stagers.png");
  });

  test("stager edit @docs", async ({ page }) => {
    const stager = scenario.stagers[0]; // acme-powershell-launcher
    // multi_launcher's display metadata (description/options descriptors) is
    // not scenario content — StagerEdit only merges the VALUES from
    // stager.options over it (see StagerEdit.vue's stagerOptions computed) —
    // so it lives here rather than as a new scenario.js fixture, matching
    // this shot's brief: reuse the existing stager mocks/fixtures, add no new
    // ones.
    const stagerTemplate = {
      id: "multi_launcher",
      name: "multi_launcher",
      description: "Generates a launcher for multiple staging methods.",
      authors: [],
      comments: [],
      options: {
        Listener: {
          value: "",
          required: true,
          description: "Listener to associate with this stager.",
        },
        Language: {
          value: "powershell",
          required: true,
          description: "Language for the launcher.",
        },
      },
    };
    await mockGeneralFormBackground(page);
    // Overrides mockGeneralFormBackground's empty listeners stub (LIFO) so
    // the Listener field -- a useSuggestedValues STRICT_FIELDS entry -- has a
    // real option to select, instead of rendering an empty dropdown.
    await mockListenersList(page, scenario.listeners);
    await mockStagerTemplates(page, [stagerTemplate]);
    await mockStagerTemplate(page, stagerTemplate);
    await mockStagerDetail(page, stager);

    await gotoDocs(page, `/#/stagers/${stager.id}`);

    await expect(
      page.getByRole("heading", { name: "View Stager" }),
    ).toBeVisible();
    // Name: a plain editable text field, distinct from the Listener/Language
    // option fields below.
    await expect(page.getByLabel(/^name$/i)).toHaveValue(stager.name);
    // Language: not a STRICT_FIELDS name and this template gives it no
    // suggested_values, so it resolves to resolveWidget's plain-text fallback
    // — toHaveValue is therefore the correct assertion, not a select's
    // rendered option text.
    await expect(page.getByLabel("Language")).toHaveValue(
      stager.options.Language,
    );

    await captureDocsShot(page, "stager_edit.png");
  });

  test("agents list @docs", async ({ page }) => {
    await mockAgentsList(page, scenario.agents);
    await gotoDocs(page, "/#/agents");
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

  test("agents graph @docs", async ({ page }) => {
    // GraphView passes :expandable="false" to <agent-graph>, so its own
    // in-component toolbar (".agent-graph__toolbar", v-if="expandable") never
    // renders — unlike the dashboard shot, which drives the bounded/expandable
    // instance. GraphView supplies its own "Show All Nodes" button instead,
    // teleported into #app-bar via list-page-top (same mechanism as every
    // other list view's header controls) — TooltipButton renders no
    // accessible name (the label text lives inside a v-tooltip, not an
    // aria-label), so it's targeted by its icon class instead.
    await mockAgentsList(page, scenario.agents);
    await mockListenersList(page, scenario.listeners);
    await mockListenerTemplates(page, scenario.listenerTemplates);

    await gotoDocs(page, "/#/agents-graph");

    const graph = page.locator('svg[aria-label="Agent topology graph"]');
    await expect(graph).toBeVisible();
    await expect(page.getByText("Failed to load graph data.")).toHaveCount(0);
    await tickUntil(
      page,
      async () => (await graph.locator(".gly-node").count()) > 0,
    );
    // Let the force simulation spread the initial cluster out of its start
    // position before fitting — same as the dashboard shot's graph handling.
    await page.clock.runFor(1200);
    // AgentGraph.vue's own 2000ms autoFitTimer is NOT enough on its own:
    // measured directly, its first-render autofit can settle against a
    // mis-sized svg under the frozen clock (same caveat the dashboard test's
    // comment already calls out) and leaves nodes translated far outside the
    // svg's viewBox — every node assertion below still passes toBeVisible()
    // in that state (Playwright's visibility check does not consider
    // transform-based off-canvas positioning, the same lesson the
    // credentials/downloads/tags shots document for overflow-x clipping),
    // but the captured PNG is a blank canvas. Explicitly triggering a fit
    // resolves it reliably.
    await page.locator("#app-bar button:has(.fa-expand)").first().click();
    await page.clock.runFor(2000);
    expect(await graph.locator(".gly-node").count()).toBeGreaterThan(0);

    // Node labels are scenario values baked directly into the SVG by
    // computer.js's shapeBuilder (agent.name / listener.name as `title`) —
    // asserting them guards against a rename silently publishing blank nodes.
    // "web-pivot" (R9TF6NCV's name) is distinct from its session_id, same
    // rationale as the agents-list shot above.
    await expect(graph.getByText("http-primary")).toBeVisible();
    await expect(graph.getByText("web-pivot")).toBeVisible();

    // Guard the exact defect measured above: toBeVisible() alone does not
    // prove a node's transform lands inside the svg's own viewport, so
    // confirm every node's bounding box actually overlaps it.
    const svgBox = await graph.boundingBox();
    const nodeBoxes = await graph
      .locator(".gly-node")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    const offCanvas = nodeBoxes.filter(
      (b) =>
        b.x + b.width < svgBox.x ||
        b.x > svgBox.x + svgBox.width ||
        b.y + b.height < svgBox.y ||
        b.y > svgBox.y + svgBox.height,
    );
    expect(
      offCanvas.length,
      "a graph node's transform places it outside the svg's viewport — " +
        "it would pass toBeVisible() while being absent from the captured " +
        "pixels",
    ).toBe(0);

    await captureDocsShot(page, "agents_graph.png");
  });

  test("modules list @docs", async ({ page }) => {
    await mockModulesList(page, scenario.modules);
    await gotoDocs(page, "/#/modules");
    await expect(
      page.getByText("powershell_situational_awareness_host_processes").first(),
    ).toBeVisible();
    // A second column, distinct from Name: `language` renders in the Language
    // column. Exact match —
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
    await mockGeneralFormBackground(page);
    await mockAgentsList(page, scenario.agents);
    await mockModulesList(page, scenario.modules);
    await mockModuleDetail(page, scenario.modules[0]);

    await gotoDocs(page, `/#/modules/${scenario.modules[0].id}`);
    await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();

    // Select three agents to show multi-agent tasking. They must share a
    // language: compatibleModules intersects each selected agent's language and
    // scenario.modules[0] is powershell-only, so mixing in a python agent
    // renders a red "No modules are compatible" banner instead of a working
    // demo. Picked by session_id, not slice(0, 3), so array order can't break
    // it.
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
    await agentsField.click();
    // Measured: 0 rendered <option> elements immediately after the click, 3
    // once the clock ticks — the item list is an rAF-driven virtual scroller,
    // and pauseAt() freezes rAF.
    await tickUntil(
      page,
      async () => (await page.getByRole("option").count()) > 0,
    );
    for (const agent of taskedAgents) {
      await page.getByRole("option", { name: agent.name }).click();
    }
    await page.keyboard.press("Escape");
    // See closeDocsOverlay's header for why Escape alone doesn't settle this.
    await closeDocsOverlay(page, agentsMenuId);

    for (const agent of taskedAgents) {
      await expect(page.getByText(agent.session_id).first()).toBeVisible();
    }
    await expect(
      page.getByText(/no modules are compatible/i),
    ).not.toBeVisible();
    await captureDocsShot(page, "multi_agent_tasking.png");
  });

  test("listener autorun modules @docs", async ({ page }) => {
    // ListenerEdit fetches the template list on mount, then the detail for
    // listener.template via its selectedTemplate watcher. Its `view` tab
    // renders <general-form>, which mounts regardless of the active tab.
    await mockGeneralFormBackground(page);
    await mockListenerDetail(page, scenario.listeners[0]);
    await mockListenerTemplates(page, scenario.listenerTemplates);
    await mockListenerTemplate(page, scenario.listenerTemplates[0]);
    await mockModulesList(page, scenario.modules);
    await mockAutorunTasks(page, scenario.autorunTasks);

    await gotoDocs(
      page,
      `/#/listeners/${scenario.listeners[0].id}?tab=autorun`,
    );

    // ListenerEdit teleports its View/Autorun tabs into #app-bar-extension —
    // see tickUntilTabStripSized's header for why they need an explicit tick.
    await tickUntilTabStripSized(page);

    // The Autorun tab teleported above must be the active one — this is
    // what step 4's "Autorun tab is the active tab in the app bar" is
    // asserting on. These assertions do not subsume tickUntilTabStripSized:
    // a zero-height extension row still passes toBeVisible() on every tab,
    // which is why that helper measures the row instead (see its header).
    const autorunTab = page.getByRole("tab", { name: "Autorun" });
    await expect(autorunTab).toBeVisible();
    await expect(autorunTab).toHaveAttribute("aria-selected", "true");

    // Both section headings — these are the two halves of the screen the
    // docs page's step 3 and step 4 describe.
    await expect(
      page.getByRole("heading", { name: "Available Modules" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Selected Modules" }),
    ).toBeVisible();
    // The picker itself, named in step 3's prose.
    await expect(
      page.getByRole("combobox", { name: "Select Module to Add" }),
    ).toBeVisible();
    // The already-configured autorun row rendered at all. Note what this does
    // NOT prove: AutoRunModules renders `${index + 1}. ${module.id ||
    // module.module_id}` and its fetchAutorunTasks falls through to the raw
    // task when no available module matches, so a task naming a nonexistent
    // module renders the identical string. The module_id cross-reference is
    // guarded in scenario.test.js instead.
    await expect(
      page.getByText(`1. ${scenario.autorunTasks[0].module_id}`),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Autorun Modules" }),
    ).toBeVisible();

    await captureDocsShot(page, "autorun_modules.png");
  });

  test("listener edit view @docs", async ({ page }) => {
    // Plain HTTP ListenerEdit on its View tab — distinct from
    // malleable_listener.png, which is the NEW-listener form for the
    // http_malleable template instead of an existing http one.
    //
    // v-window mounts BOTH the View and Autorun window-items regardless of
    // which is active (see the autorun shot's mockGeneralFormBackground
    // comment above), so AutoRunModules' immediate fetchAutorunTasks /
    // fetchAvailableModules calls still fire here even though Autorun is
    // never the active tab — hence mockModulesList and mockAutorunTasks
    // below, or those requests would hit the 599 sentinel.
    await mockGeneralFormBackground(page);
    await mockListenerDetail(page, scenario.listeners[0]);
    await mockListenerTemplates(page, scenario.listenerTemplates);
    await mockListenerTemplate(page, scenario.listenerTemplates[0]);
    await mockModulesList(page, scenario.modules);
    await mockAutorunTasks(page, scenario.autorunTasks);

    await gotoDocs(page, `/#/listeners/${scenario.listeners[0].id}?tab=view`);

    // ListenerEdit teleports its View/Autorun tabs into #app-bar-extension —
    // see tickUntilTabStripSized's header for why they need an explicit tick.
    await tickUntilTabStripSized(page);

    const viewTab = page.getByRole("tab", { name: "View" });
    await expect(viewTab).toBeVisible();
    await expect(viewTab).toHaveAttribute("aria-selected", "true");

    await expect(
      page.getByRole("heading", { name: "View Listener" }),
    ).toBeVisible();
    // Host/Port values come from the http listener's own options, merged
    // over the http template's descriptors (ListenerEdit.vue's
    // listenerOptions computed) — a renamed options key would publish blank
    // fields here.
    await expect(page.getByLabel("Host")).toHaveValue(
      scenario.listeners[0].options.Host,
    );
    await expect(page.getByLabel("Port")).toHaveValue(
      scenario.listeners[0].options.Port,
    );

    await captureDocsShot(page, "listener_edit.png");
  });

  test("plugins list @docs", async ({ page }) => {
    await mockInstalledPlugins(page, scenario.plugins);

    await gotoDocs(page, "/#/plugins");

    // The only rendered field is plugin.name (PluginsList.vue's
    // v-list-item-title) — a renamed field publishes an empty list with a
    // green gate otherwise.
    await expect(page.getByText("basic_reporting")).toBeVisible();

    await captureDocsShot(page, "plugins_list.png");
  });

  test("plugin marketplace @docs", async ({ page }) => {
    await mockPluginMarketplace(page, scenario.marketplace);

    await gotoDocs(page, "/#/plugin-marketplace");

    // Left rail: both entries. PluginMarketplace sorts by name.localeCompare,
    // so a record without a string `name` throws before anything renders.
    await expect(page.getByText("Basic Reporting")).toBeVisible();
    await expect(page.getByText("Empire MCP")).toBeVisible();

    // The right-hand detail card only exists once a row is selected — an
    // unselected marketplace is a half-empty screen that teaches nothing.
    await page.getByText("Basic Reporting").click();
    await expect(page.getByText(/exports engagement data/i)).toBeVisible();
    // Registry and Version selects, and the Install action: the three
    // controls a reader has to recognize to install a plugin.
    await expect(page.getByLabel("Registry")).toBeVisible();
    await expect(page.getByLabel("Version")).toBeVisible();
    await expect(page.getByRole("button", { name: "Install" })).toBeVisible();

    await captureDocsShot(page, "plugin_marketplace.png");
  });

  test("plugin dependency warning @docs", async ({ page }) => {
    // PluginEdit's Interact tab renders <general-form>, which mounts
    // regardless of which tab is active.
    await mockGeneralFormBackground(page);
    await mockPluginDetail(page, scenario.plugins[0]);

    // With loaded/enabled/execution_enabled all false, interactDisabled is
    // true and PluginEdit defaults to the details tab on its own — but pass
    // it explicitly so the shot does not depend on that fallback.
    // tick: 0 is load-bearing. settleImages' header spells out why: the first
    // clock tick on this page flips VTabs' mandatory-selection fallback onto a
    // DISABLED tab (three of PluginEdit's four are disabled for this fixture),
    // which hides the alert this shot exists to show. The toHaveText checks
    // below still pass on a display:none element, so the breakage would only
    // surface as an opaque locator.screenshot() timeout.
    await gotoDocs(page, `/#/plugins/${scenario.plugins[0].id}?tab=details`, {
      tick: 0,
    });

    // Both strings are generated, not literal: pluginDepsMessage branches on
    // python_deps being non-empty, and pluginDepsCommand joins the same array.
    await expect(page.locator(".plugin-deps-message")).toHaveText(
      "This plugin requires additional Python dependencies. Please install and restart the server.",
    );
    await expect(page.locator(".plugin-deps-command")).toHaveText(
      "poetry add twilio",
    );

    // Locator clip -> locator.screenshot(), which captures the alert alone.
    await captureDocsShot(page, "plugin-dependencies.png", {
      clip: page.locator(".v-alert").first(),
    });
  });

  test("plugin edit @docs", async ({ page }) => {
    // Full-viewport PluginEdit, unlike plugin-dependencies.png's clipped
    // single-alert capture above — same plugin fixture, different framing.
    await mockGeneralFormBackground(page);
    // PluginTasksList's mounted() hook always calls pluginStore.getPlugins(),
    // even on this tab's plugin-scoped instance where its own Plugins filter
    // is hidden (v-if="!plugin") — see the plugin-tasks shot below for the
    // full mechanism.
    await mockInstalledPlugins(page, scenario.plugins);
    await mockPluginDetail(page, scenario.plugins[0]);
    // The Tasks window-item (PluginTasksList) mounts regardless of the active
    // tab, same v-window eagerness as ListenerEdit's View/Autorun items
    // above. Its Users filter auto-selects everything on mount (same
    // ExpansionPanelFilter default the downloads-list shot documents), which
    // makes selectedUsers non-empty and TasksTable.getTasks() actually fire —
    // without this mock that GET hits the 599 sentinel even though the Tasks
    // tab is never displayed.
    await mockPluginTasks(page, scenario.pluginTasks);

    await gotoDocs(page, `/#/plugins/${scenario.plugins[0].id}?tab=details`);

    // PluginEdit teleports its tab strip into #app-bar-extension, same
    // mechanism as ListenerEdit/AgentEdit above.
    await tickUntilTabStripSized(page);

    // The `?tab=details` query alone does NOT land on Details: the Details
    // v-window-item is gated behind `v-if="initialLoad"` (PluginEdit.vue),
    // so at first paint — before getPlugin() resolves — VWindow's group has
    // no "details" child to match against the route-derived model value and
    // self-corrects by calling the `tab` setter with "interact" (the first
    // registered item), permanently overwriting the query via
    // router.replace before initialLoad ever flips true. Measured directly:
    // without this click, aria-selected stays false on Details and true on
    // Interact even after tickUntilTabStripSized. Click it explicitly, the
    // same way a real operator would after the page finishes loading, then
    // tick the frozen clock — the resulting router.replace resolves via a
    // microtask that this suite's paused clock does not flush on its own
    // (confirmed empirically: reading aria-selected synchronously right
    // after the click still showed the stale value).
    const detailsTab = page.getByRole("tab", { name: "Details" });
    await expect(detailsTab).toBeVisible();
    await detailsTab.click();
    await page.clock.runFor(300);
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");

    // Same dependency-warning content as plugin-dependencies.png, proving the
    // full page still renders it correctly framed.
    await expect(page.locator(".plugin-deps-message")).toHaveText(
      "This plugin requires additional Python dependencies. Please install and restart the server.",
    );
    await expect(page.locator(".plugin-deps-command")).toHaveText(
      "poetry add twilio",
    );
    // The Enabled switch lives in edit-page-top's extra-stuff slot, outside
    // the clipped v-alert the other shot captures — asserting it visible
    // proves this capture spans the full page, not just the alert.
    await expect(page.getByText("Enabled")).toBeVisible();

    await captureDocsShot(page, "plugin_edit.png");
  });

  test("plugin tasks @docs", async ({ page }) => {
    // Standalone PluginTasksList (plugin: null prop) — its own Plugins filter
    // renders here (v-if="!plugin"), unlike the plugin-scoped instance inside
    // PluginEdit above.
    await mockInstalledPlugins(page, scenario.plugins);
    await mockPluginTasks(page, scenario.pluginTasks);

    await gotoDocs(page, "/#/plugin-tasks");

    // Both the Plugins and Users expansion-panel filters auto-select every
    // item on mount (ExpansionPanelFilter's default when emptyDefault is not
    // set — same mechanism the downloads-list shot documents), which is what
    // makes selectedEntities/selectedUsers non-empty and TasksTable.getTasks()
    // actually fire: it no-ops to an empty list whenever either is empty. So
    // the populated table below is itself proof that mechanism worked, not
    // merely that the mock exists.
    //
    // TasksTable.vue's mounted() hook calls debouncedGetTasks() (a
    // lodash.debounce-wrapped getTasks, 500ms) immediately, before the
    // Plugins/Users filters' own async store fetches have resolved — so that
    // FIRST call's getTasks() sees empty selectedEntities/selectedUsers and
    // no-ops (see the comment above). The filters' items arrays only
    // populate once pluginStore.getPlugins()/userStore.getUsers() resolve,
    // which re-triggers debouncedGetTasks() via TasksTable's
    // selectedEntities/selectedUsers watchers — but resolving those mocked
    // fetches needs the browser's REAL event loop to run, which
    // page.clock.runFor() does not provide: it only advances the fake
    // in-page timer clock the debounce's setTimeout is gated on, not actual
    // network/microtask processing. So a real wait has to come first (to let
    // the stores populate and reschedule the debounce correctly), and only
    // then does ticking the fake clock let that rescheduled timer fire.
    // Measured directly: ticking the fake clock alone, however far, never
    // gets a single GET /plugins/tasks request to fire.
    await page.waitForTimeout(500);
    await page.clock.runFor(600);
    await tickUntil(
      page,
      async () => (await page.getByText("basic_reporting").count()) > 0,
    );

    // Plugin column: only rendered when no `entity` prop is bound
    // (TasksTable.vue's `v-if="!entity"` on the item.<idField> slot) — true
    // here, false inside PluginEdit's Tasks tab.
    await expect(
      page.getByRole("link", { name: "basic_reporting" }).first(),
    ).toBeVisible();
    // User column: plain text, distinct from the Plugin link above.
    await expect(page.getByText("admin", { exact: true })).toBeVisible();
    await expect(page.getByText("operator", { exact: true })).toBeVisible();

    await captureDocsShot(page, "plugin_tasks.png");
  });

  test("malleable profiles list @docs", async ({ page }) => {
    await mockMalleableProfilesList(page, scenario.malleableProfiles);

    await gotoDocs(page, "/#/malleable-profiles");

    // One assertion per default-visible column (Name, Category, Updated At).
    // Name renders as a router-link; Updated At goes through
    // DateTimeDisplay, which renders a relative string off the frozen clock
    // and silently shows "N/A" for an unparseable value.
    await expect(page.getByRole("link", { name: "acme-amazon" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "acme-onedrive" }),
    ).toBeVisible();
    await expect(page.getByText("amazon", { exact: true })).toBeVisible();
    await expect(page.getByText("onedrive", { exact: true })).toBeVisible();
    await expect(page.getByText("3 days ago")).toBeVisible();
    await expect(page.getByText("a day ago")).toBeVisible();

    await captureDocsShot(page, "malleable_profiles.png");
  });

  test("malleable profile edit @docs", async ({ page }) => {
    const profile = scenario.malleableProfiles[0]; // acme-amazon
    await mockMalleableProfileDetail(page, profile);

    await gotoDocs(page, `/#/malleable-profiles/${profile.id}`);

    // The mode computed returns "View" for a non-new, non-copy record, same
    // convention as bypass_edit.png below.
    await expect(
      page.getByRole("heading", { name: "View Malleable Profile" }),
    ).toBeVisible();
    // MalleableProfileEdit has no <general-form> — these three v-text-field/
    // v-textarea controls (labels are lowercase in the template: "name",
    // "category", "code") are bound directly to form.*, so a renamed field
    // publishes an empty editor and these fail.
    await expect(page.getByLabel("name")).toHaveValue(profile.name);
    await expect(page.getByLabel("category")).toHaveValue(profile.category);
    await expect(page.getByLabel("code")).toHaveValue(/sample_name "Amazon"/);

    await captureDocsShot(page, "malleable_profile_edit.png");
  });

  test("bypasses list @docs", async ({ page }) => {
    await mockBypassesList(page, scenario.bypasses);

    await gotoDocs(page, "/#/bypasses");

    // Name column: renders as a router-link to the edit route.
    await expect(
      page.getByRole("link", { name: "etw", exact: true }),
    ).toBeVisible();
    // Updated At column: routes through DateTimeDisplay, which silently shows
    // "N/A" for an unparseable value — assert the relative string so a bad
    // timestamp fails instead of publishing "N/A". FROZEN_TIME is 2026-06-15
    // 14:30Z and etw's updated_at is hoursAgo(6), so it renders "6 hours ago".
    await expect(page.getByText("6 hours ago")).toBeVisible();

    await captureDocsShot(page, "bypasses_list.png");
  });

  test("bypass edit @docs", async ({ page }) => {
    const bypass = scenario.bypasses[0]; // etw, has real code
    await mockBypassesList(page, scenario.bypasses);
    await mockBypassDetail(page, bypass);

    await gotoDocs(page, `/#/bypasses/${bypass.id}`);

    // The mode computed returns "View" for a non-new, non-copy record, so the
    // heading self-labels "View Bypass" (see the docs page, which matches this).
    await expect(
      page.getByRole("heading", { name: "View Bypass" }),
    ).toBeVisible();
    // The code control is a text field bound to form.code — assert its VALUE
    // (getByText will not match an input/textarea value). "PSEtwLogProvider" is
    // a unique substring of the etw code; a renamed field publishes an empty
    // editor and this fails.
    await expect(page.getByLabel("code")).toHaveValue(/PSEtwLogProvider/);

    await captureDocsShot(page, "bypass_edit.png");
  });

  test("malleable listener form @docs", async ({ page }) => {
    const malleable = scenario.listenerTemplates[1];
    await mockGeneralFormBackground(page);
    await mockListenerTemplates(page, scenario.listenerTemplates);
    await mockListenerTemplate(page, malleable);

    // /listeners/new has no listener to fetch — only the template list. The
    // type dropdown drives the template detail fetch.
    await gotoDocs(page, "/#/listeners/new");

    // The type selector is the only combobox on a fresh /listeners/new form:
    // general-form (which could render other comboboxes, e.g. Profile once a
    // Malleable template is selected) is `v-if="initialLoad"` and stays
    // unmounted until a template has been fetched, and ListenerEdit.vue gives
    // its v-autocomplete label="Type" — confirmed by reading the component
    // rather than guessing at DOM position.
    const typeField = page.getByRole("combobox", { name: "Type" });
    // Captured before opening the menu, same as the multi-agent tasking
    // test's agentsMenuId: aria-controls is on the field itself, unaffected
    // by the menu's open/closed state, and reused below to scope the
    // post-close overlay check to this specific dropdown.
    const typeMenuId = await typeField.getAttribute("aria-controls");
    await typeField.click();
    // Same rAF-driven virtual scroller as the multi-agent tasking shot above.
    await tickUntil(
      page,
      async () => (await page.getByRole("option").count()) > 0,
    );
    await page.getByRole("option", { name: "http_malleable" }).click();

    // The Profile dropdown is the one thing malleable-c2.md's prose says
    // distinguishes this form from the plain HTTP listener, so assert it
    // specifically rather than just "the form rendered". The template data
    // names the option "Profile" (singular) — the docs prose calls it the
    // "Profiles dropdown", but assert against what actually renders.
    await expect(page.getByLabel("Profile")).toBeVisible();
    await expect(page.getByLabel("Host")).toBeVisible();
    await expect(page.getByLabel("Port")).toBeVisible();
    await expect(
      page.getByText(/adheres to a Malleable C2 profile/i),
    ).toBeVisible();

    // Selecting an option closes the menu logically, but see closeDocsOverlay's
    // header for why the content element can stay visually present anyway.
    await closeDocsOverlay(page, typeMenuId);

    await captureDocsShot(page, "malleable_listener.png");
  });

  test("agent interact view @docs", async ({ page }) => {
    // K3H8P2WQ is powershell. AgentExecuteModule intersects the selected
    // agent's language group against each module's language, so a python
    // agent here would render "No modules are compatible" instead of a
    // populated picker.
    const agent = scenario.agents.find((a) => a.session_id === "K3H8P2WQ");
    await mockAgentDetail(page, agent);
    await mockAgentDetailSubResources(page);
    // MUST come after mockAgentDetailSubResources: that helper stubs
    // GET /modules as an EMPTY list, and routes resolve LIFO. Without this
    // the shot publishes an agent with an empty module dropdown.
    await mockModulesList(page, scenario.modules);

    await gotoDocs(page, `/#/agents/${agent.session_id}`);

    // AgentEdit teleports its tab strip into #app-bar-extension, same as
    // ListenerEdit above. Verified empirically: without this tick the whole
    // six-tab row (Interact/File Browser/Tasks/Jobs/Stats/View) is absent from
    // the capture. See tickUntilTabStripSized's header for the mechanism.
    await tickUntilTabStripSized(page);

    // tab defaults to "interact" and interactTab to "module", so this lands
    // on AgentExecuteModule with no clicking. As in the autorun shot above,
    // these confirm the right tabs render given a sized strip — they cannot
    // stand in for tickUntilTabStripSized, since a zero-height extension row
    // still passes toBeVisible() on every tab.
    await expect(page.getByRole("tab", { name: "Interact" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tasks" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "View" })).toBeVisible();
    // AgentExecuteModule prints this literal followed by agent.name.
    await expect(page.getByText("Executing on Agents:")).toBeVisible();
    await expect(page.getByText(agent.name).first()).toBeVisible();

    // The module picker must be populated, not merely present — but
    // getByPlaceholder is useless here: AgentExecuteModule initializes
    // `selectedModule: ""`, and Vuetify's transformIn wraps any non-nullish
    // model value into a one-element array, so isDirty is true and the
    // placeholder is suppressed from the first render regardless of whether
    // modules loaded. So prove population by opening the picker, asserting a
    // real module id renders as an option, then closing it as the tests above
    // close their dropdowns.
    const moduleField = page.locator(".v-autocomplete .v-field");
    const moduleInput = page.locator(".v-autocomplete input[role='combobox']");
    const moduleMenuId = await moduleInput.getAttribute("aria-controls");
    await moduleField.click();
    // Same rAF-driven virtual scroller as the other dropdowns in this file.
    await tickUntil(
      page,
      async () => (await page.getByRole("option").count()) > 0,
    );
    await expect(
      page.getByRole("option", {
        name: "powershell_situational_awareness_host_processes",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/no modules are compatible/i),
    ).not.toBeVisible();
    await page.keyboard.press("Escape");
    await closeDocsOverlay(page, moduleMenuId);

    await captureDocsShot(page, "agent_interact.png");
  });

  test("agent file browser @docs", async ({ page }) => {
    // Reuse the interact shot's powershell agent (WIN-DC01). mockAgentDetail
    // is required: navigating to /agents/{id} fetches the bare
    // GET /agents/{id}, which neither mockAgentsList nor
    // mockAgentDetailSubResources serves — without it that GET hits the 599
    // sentinel and the afterEach fails.
    const agent = scenario.agents.find((a) => a.session_id === "K3H8P2WQ");
    await mockAgentDetail(page, agent);
    await mockAgentDetailSubResources(page);
    await mockAgentDirectory(page, agent.session_id, scenario.agentFiles);

    await gotoDocs(page, `/#/agents/${agent.session_id}`);

    // AgentEdit teleports its tab strip into #app-bar-extension; the
    // VExpandTransition height restore runs in an rAF the paused clock never
    // fires, so without this the six-tab row is height:0 and clipped out of
    // the capture though every tab still passes toBeVisible().
    await tickUntilTabStripSized(page);

    await page.getByRole("tab", { name: "File Browser" }).click();

    // Let the tab-panel transition + treeview render settle (rAF-driven).
    await tickUntil(
      page,
      async () => (await page.getByText("seatbelt-output.txt").count()) > 0,
    );

    // Load-bearing: scenario filenames render as treeview nodes. This is a
    // v-treeview (not a data-table), so assert on node text, not table cells,
    // and there is no ≤10-row paginator concern here.
    await expect(page.getByText("seatbelt-output.txt")).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible();

    await captureDocsShot(page, "agent_file_browser.png");
  });

  test("agent check-in notification @docs", async ({ page }) => {
    await seedNotifications(page, scenario.notifications);
    await mockAgentsList(page, scenario.agents);

    await gotoDocs(page, "/#/agents");

    // The badge counts unread items. NotificationBell clears it via
    // markAllNotificationsAsRead() when the menu CLOSES, so the badge only
    // exists up to and including the moment of capture — assert it before
    // opening the menu, not after.
    const bell = page.locator("button:has(.mdi-bell-outline)");
    await expect(bell).toBeVisible();
    // Scoped to the bell specifically: the chat button elsewhere in the app
    // bar carries its own v-badge (unread count "0"), and .v-badge__badge is
    // not otherwise unique on the page.
    await expect(bell.locator(".v-badge__badge")).toHaveText("1");

    // aria-controls is on the activator itself, unaffected by open/closed
    // state — same pattern as the multi-agent-tasking and malleable-listener
    // tests' menuId captures above.
    const menuId = await bell.getAttribute("aria-controls");
    expect(
      menuId,
      "no aria-controls on the notification bell — the overlay lookup below " +
        "would silently match nothing",
    ).toBeTruthy();
    await bell.click();

    // VMenu's default transition is VDialogTransition, whose onEnter awaits two
    // rAF ticks and then drives the fade through the WAAPI Element.animate().
    // That is neither a CSS transition (so prepareDocsPage's `transition:none`
    // override does not touch it) nor window.requestAnimationFrame (WAAPI runs
    // against document.timeline), so ticking the fake clock alone never
    // reliably reached the end state — measured: still short of the expanded
    // ~177px content height after 1500ms of fake time.
    //
    // So finish it directly: tick until Element.animate() has been called (it
    // has not immediately after the click, since the two rAF awaits have not
    // resolved), then Animation.finish() every in-flight animation. A poll
    // timeout here means those rAF awaits never resolved.
    await tickUntil(
      page,
      async () =>
        (await page.evaluate(() => document.getAnimations().length)) > 0,
    );
    // dialog-transition.js starts one animation on the overlay plus a per-child
    // opacity animation, so finish() every in-flight one rather than the first
    // found — then give the DOM a tick for onEnter's cleanup of the temporary
    // inline pointer-events/visibility styles onBeforeEnter set.
    await page.evaluate(() => {
      document.getAnimations().forEach((a) => a.finish());
    });
    await page.clock.runFor(50);

    const menuHeight = await page
      .locator(`#${menuId} .v-overlay__content`)
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(
      menuHeight,
      `notification menu overlay is still collapsed after finishing its ` +
        `open animation (height=${menuHeight}px) — its rows would be ` +
        `clipped out of the capture`,
    ).toBeGreaterThan(150);

    // Both notifications plus the menu footer, so a renamed store field
    // (item.text is NOT item.message) fails instead of publishing blank rows.
    await expect(page.getByText("New Agent", { exact: true })).toBeVisible();
    await expect(
      page.getByText("New Agent 'R9TF6NCV' callback!"),
    ).toBeVisible();
    await expect(
      page.getByText("New Listener 'http-primary' started!"),
    ).toBeVisible();
    await expect(page.getByText("View All")).toBeVisible();

    // Full viewport, no clip: the agents table behind the menu is part of
    // what this image shows, and every full-page shot in the set is 2880x1440.
    // The four deliberate element clips are plugin-dependencies.png,
    // tag_picker.png, obfuscation_keywords.png and obfuscation_global.png.
    await captureDocsShot(page, "starkiller_checkin.png");
  });

  test("credentials list @docs", async ({ page }) => {
    // mockTagsRegistry covers the whole **/api/v2/tags* glob, so it serves both
    // Credentials.vue's fetchTags("credential") and the picker's bare registry
    // fetch. Registered here, not in beforeEach, so LIFO puts it ahead of the
    // empty tag list mockDocsBackground registers via mockTagsEndpoint.
    await mockTagsRegistry(page, scenario.tags);
    await mockCredentialsList(page, scenario.credentials);

    await gotoDocs(page, "/#/credentials");

    // One assertion per default-visible column. This table has no
    // defaultHeader convention and no column picker (Credentials.vue:154-163
    // is a static array), so every column below always renders and a
    // renamed field would publish a blank cell with a green gate.
    // id: renders as a router-link styled with color:inherit, so it reads
    // as plain text rather than a blue link — assert via role, not text.
    await expect(
      page.getByRole("link", { name: "1", exact: true }),
    ).toBeVisible();
    // CredType: only "plaintext" and "hash" appear in this scenario (see the
    // credentials comment below), each on multiple rows — .first() confirms
    // the column renders rather than asserting which row.
    await expect(page.getByText("hash").first()).toBeVisible();
    // Username: click-to-copy div, not a link.
    await expect(page.getByText("svc-backup")).toBeVisible();
    // Password renders in the clear — this is the screen's defining detail.
    // Row 2's bare NT hash is unique in the table.
    await expect(
      page.getByText("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"),
    ).toBeVisible();
    // Domain: every scenario record shares "example.com" so this cell
    // repeats across the table — .first() confirms the column renders
    // rather than asserting which row.
    await expect(page.getByText("example.com").first()).toBeVisible();
    // Host: DC-01 is unique to row 2, unlike some other host values reused
    // across rows.
    await expect(page.getByText("DC-01")).toBeVisible();
    // Tags column: a real chip, not the empty-state "Add tags" affordance.
    await expect(page.getByText("domain-admin")).toBeVisible();

    // toBeVisible() does NOT detect clipping by an ancestor's overflow-x, so a
    // column pushed outside the table wrapper passes every assertion above
    // while being absent from the captured pixels. The first version of this
    // shot lost Host, Tags and Actions off-frame with a fully green test.
    const overflow = await page
      .locator(".v-table__wrapper")
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(
      overflow,
      "the table overflows its wrapper horizontally, so the right-hand " +
        "columns are clipped out of the capture",
    ).toBeLessThanOrEqual(1);

    await captureDocsShot(page, "credentials.png");
  });

  test("tag picker @docs", async ({ page }) => {
    // Same registry mock, and same LIFO reason, as the credentials-list test.
    await mockTagsRegistry(page, scenario.tags);
    await mockCredentialsList(page, scenario.credentials);

    await gotoDocs(page, "/#/credentials");
    await expect(page.getByText("svc-backup")).toBeVisible();

    // Open from an untagged row. TagViewer renders the literal "Add tags"
    // text only when the row has no tags (TagViewer.vue:9-14); a tagged row
    // is a bare + icon with no accessible name. scenario.credentials ids 3-5
    // are untagged, so several such chips exist — .first() is the row-3 chip.
    await page.getByText("Add tags").first().click();

    // TagPickerDialog is a v-dialog, whose default transition is also
    // VDialogTransition (dialog-transition.js) — same mechanism the check-in
    // notification menu above needs a runFor loop for. Unlike that menu's
    // CLOSE path (the one the capture skill's force-hide workaround exists
    // for), this is the OPEN path, which the skill notes works fine and
    // which starkiller_checkin.png already exercises without a workaround.
    // Tick until the overlay is genuinely active, not merely present in the
    // DOM — onEnter's rAF awaits make no progress on the frozen clock.
    await tickUntil(page, () => page.locator(".v-overlay--active").isVisible());

    // Assert on registry content rendered INSIDE the dialog, so a broken
    // registry fetch cannot publish an empty picker.
    const dialog = page.locator(".v-dialog");
    await expect(dialog.getByText("Add tags")).toBeVisible();
    // exact: true — tag 1's description ("Collected during the current
    // engagement") also contains the substring "engagement", which would
    // otherwise resolve two elements and trip Playwright's strict mode.
    await expect(dialog.getByText("engagement", { exact: true })).toBeVisible();
    await expect(dialog.getByText("domain-admin")).toBeVisible();
    // exact: true — the field's clearable icon carries aria-label
    // "Clear Filter tags", a substring match for "Filter tags" that would
    // otherwise also trip strict mode here.
    await expect(
      dialog.getByLabel("Filter tags", { exact: true }),
    ).toBeVisible();

    // dialog (".v-dialog") is Vuetify's fixed, full-viewport positioning
    // wrapper it uses to center the card — clipping to it captures the
    // entire empty viewport with the card as a small region inside. The
    // visible card lives in the nested ".v-overlay__content" box, so that is
    // what must be clipped for a dialog-only shot.
    await captureDocsShot(page, "tag_picker.png", {
      clip: dialog.locator(".v-overlay__content"),
    });
  });

  test("downloads list @docs", async ({ page }) => {
    // Downloads.vue's fetchTags("download") hits the same glob — see the
    // credentials-list test for why this is registered here.
    await mockTagsRegistry(page, scenario.tags);
    await mockDownloadsList(page, scenario.downloads);

    await gotoDocs(page, "/#/downloads");

    // Default-visible columns: Id, Filename, Size, Created At, Updated At,
    // Tags, Actions (Downloads.vue:148-156, a static array).
    // Id: unlike the credentials table, Downloads.vue defines no
    // #item.id template, so it's a plain text cell, not a router-link — a
    // bare getByText("1") would match many cells (row count, "18 KB", tag
    // ids, pagination), so scope to a table cell role with exact: true.
    await expect(
      page.getByRole("cell", { name: "1", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("seatbelt-output.txt")).toBeVisible();
    await expect(page.getByText("beacon-x64.bin")).toBeVisible();
    // Size goes through formatBytes: 18432 -> "18 KB", 1310720 -> "1.25 MB".
    await expect(page.getByText("18 KB")).toBeVisible();
    // Created/Updated go through DateTimeDisplay, which renders a relative
    // string off the frozen clock and silently shows "N/A" for an
    // unparseable value.
    await expect(page.getByText("3 hours ago").first()).toBeVisible();
    // Tags column, a real chip rather than the "Add tags" empty state.
    await expect(page.getByText("exfil").first()).toBeVisible();

    // The four sources are this page's central concept and the panel holding
    // them is COLLAPSED by default — Downloads.vue:27 mounts
    // <v-expansion-panels> with no v-model, so a bare capture publishes a
    // 250px card containing the words Search / Source / Tags and nothing
    // else. Expand it. Scope to the filter card: "Tags" is also a sidebar
    // nav item (SideNav.vue), and "Source" must not match a table header.
    const filterCard = page.locator(".v-expansion-panels");
    await filterCard.getByRole("button", { name: "Source" }).click();

    // v-expansion-panel-text animates open through VExpandTransition, so the
    // panel body can sit at height:0 while its checkboxes still pass
    // toBeVisible() — exactly the failure two shots in the previous branch
    // hit, caught only by an explicit height assertion. Same rAF-freeze
    // mechanism the tab strip needs, so it uses the same helper.
    const panelBody = filterCard.locator(".v-expansion-panel-text").nth(1);
    await tickUntilSized(page, panelBody);

    // All four sources are ticked on mount: ExpansionPanelFilter's mounted()
    // hook selects everything unless emptyDefault is set, and the Source
    // panel does not set it (Downloads.vue:33-40).
    await expect(panelBody.getByText("Upload")).toBeVisible();
    await expect(panelBody.getByText("Agent Task")).toBeVisible();
    await expect(panelBody.getByText("Agent File")).toBeVisible();
    await expect(panelBody.getByText("Stager")).toBeVisible();

    // toBeVisible() does NOT detect clipping by an ancestor's overflow-x, so a
    // column pushed outside the table wrapper passes every assertion above
    // while being absent from the captured pixels. The credentials-list shot
    // above lost Host, Tags and Actions off-frame this way with a fully green
    // test. The downloads table has no fixed-width Tags column and short
    // content columns, so it is likely to fit — but assert it rather than
    // assume it.
    const overflow = await page
      .locator(".v-table__wrapper")
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(
      overflow,
      "the table overflows its wrapper horizontally, so the right-hand " +
        "columns are clipped out of the capture",
    ).toBeLessThanOrEqual(1);

    await captureDocsShot(page, "downloads.png");
  });

  test("tags registry @docs", async ({ page }) => {
    await mockTagsRegistry(page, scenario.tags);

    await gotoDocs(page, "/#/tags");

    // Default-visible columns: Name, Description, Usage, Actions
    // (Tags.vue:48-53). Name renders as a TagChip, not text — exact:true
    // because a tag's own description also contains its name as a substring
    // and TagChip puts the name in a title attribute too.
    await expect(page.getByText("engagement", { exact: true })).toBeVisible();
    await expect(page.getByText("domain-admin", { exact: true })).toBeVisible();
    // Description column:
    await expect(
      page.getByText("Grants Domain Admin on example.com"),
    ).toBeVisible();
    // Usage column. These counts must equal the tags actually attached to
    // scenario.credentials and scenario.downloads, or a reader who
    // cross-references this image against credentials.png catches the docs
    // contradicting themselves. Nothing else checks this.
    await expect(page.getByText("4", { exact: true })).toBeVisible();

    // toBeVisible() does NOT detect clipping by an ancestor's overflow-x, so a
    // column pushed outside the table wrapper passes every assertion above
    // while being absent from the captured pixels. The credentials-list shot
    // lost Host, Tags and Actions off-frame this way with a fully green test.
    const overflow = await page
      .locator(".v-table__wrapper")
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(
      overflow,
      "the table overflows its wrapper horizontally, so the right-hand " +
        "columns are clipped out of the capture",
    ).toBeLessThanOrEqual(1);

    await captureDocsShot(page, "tags.png");
  });

  test("obfuscation @docs", async ({ page }) => {
    await mockObfuscationKeywords(page, scenario.obfuscationKeywords);
    await mockObfuscationGlobal(page, scenario.obfuscationConfigs);

    await gotoDocs(page, "/#/obfuscation");

    // Left card: the keyword table's two data columns. mockObfuscationKeywords
    // returned a hardcoded empty list until this branch, so an unpopulated
    // left card is the specific regression to guard against here.
    await expect(page.getByText("Invoke-Mimikatz")).toBeVisible();
    await expect(page.getByText("K7QW2")).toBeVisible();

    // Right card: one bordered sub-card per language. All three ship
    // disabled, and only powershell is preobfuscatable — which is why its
    // Preobfuscate button is enabled and the other two are not.
    await expect(page.getByText("powershell")).toBeVisible();
    await expect(page.getByText("csharp")).toBeVisible();
    await expect(page.getByText("python")).toBeVisible();
    // The command field is the non-obvious part of the config; assert its value
    // so a renamed field cannot publish an empty input. v-text-field renders it
    // as a form control, not text content, so getByText can't see it — use
    // toHaveValue, as elsewhere in this repo. All three language sub-cards
    // share the "Command" label; powershell renders first and is the only one
    // with a non-empty default, so .first() targets it.
    await expect(page.getByLabel("Command").first()).toHaveValue(
      "Token\\All\\1",
    );

    // Two clipped shots rather than one full-viewport capture. The two
    // mechanisms are independent and the docs page treats them under
    // separate headings, so one image per heading matches the prose — and
    // three language sub-cards do not fit in 720px, so a single shot would
    // crop python off the bottom.
    const keywordCard = page
      .locator(".v-card")
      .filter({ hasText: "Keyword Obfuscation" })
      .first();
    const globalCard = page
      .locator(".v-card")
      .filter({ hasText: "Global Obfuscation" })
      .first();

    // Guard BEFORE capturing, per this suite's central rule. Both filters
    // could collapse onto the same ancestor card that contains both
    // headings, in which case the two captures would write byte-identical
    // images and still report success. Comparing bounding boxes catches
    // that; a count() check does not, because the ancestor and the two
    // real cards together satisfy any count assertion.
    const keywordBox = await keywordCard.boundingBox();
    const globalBox = await globalCard.boundingBox();
    expect(
      keywordBox.x,
      "the two obfuscation card locators resolved to the same element, so " +
        "the clips would publish two identical images",
    ).not.toBe(globalBox.x);

    await captureDocsShot(page, "obfuscation_keywords.png", {
      clip: keywordCard,
    });

    // globalCard (918px) exceeds the 720px viewport, so locator.screenshot()
    // would reach for CDP's captureBeyondViewport — which paints position:fixed
    // elements at their viewport-relative coordinates onto the oversized canvas
    // rather than scrolling them out of frame. Measured at the default 720px
    // viewport: App.vue's fixed app-bar icons and footer links were baked into
    // the card, with every assertion above still green because they check the
    // unclipped DOM, not the captured pixels.
    //
    // Growing the viewport so the card fits avoids captureBeyondViewport
    // entirely: the footer's fixed band just needs to sit below the card's
    // bottom edge, and the app-bar is already above the card's start. Computed
    // from the measured boxes rather than hardcoded, so this survives the card
    // growing taller.
    const footerBox = await page.locator(".v-footer").boundingBox();
    await page.setViewportSize({
      width: 1440,
      height: Math.ceil(globalBox.y + globalBox.height + footerBox.height + 40),
    });
    await captureDocsShot(page, "obfuscation_global.png", {
      clip: globalCard,
    });
  });

  test("dashboard @docs", async ({ page }) => {
    // Grow the viewport up front so every card — including the charts below the
    // topology — lays out at full size and the topology svg gets real
    // dimensions to fit its nodes into.
    await page.setViewportSize({ width: 1440, height: 1800 });

    // CheckinChart's timeframe defaults to "Second", whose window is 60s
    // ("Last 60 Seconds") — it would caption the card with a minute while
    // plotting checkinAggregate's 10-hour span, on a per-second axis. "Hour"
    // is the one that matches the fixture: a 24h window, hourly buckets. It
    // also drops the refresh cadence from 5s to 5min, so the ~6.7s of clock
    // this test ticks can no longer cross a poll boundary mid-capture.
    // Persisted in the `application` slice, so patch it the same way
    // prepareDocsPage patches empireVersion — before any navigation.
    await page.addInitScript(() => {
      const raw = localStorage.getItem("application");
      if (!raw) throw new Error("dashboard: setFakeAuth must run first");
      const state = JSON.parse(raw);
      state.dashboardCheckinTimeframe = "Hour";
      localStorage.setItem("application", JSON.stringify(state));
    });

    // Stat cards + doughnut come from the three list stores; the Topology card
    // (agent-graph) fetches /listener-templates on mount. mockDashboardOnly-
    // Endpoints stubs the non-aggregate /checkins/ path and /agents/tasks
    // empty; the two populated mocks after it win by LIFO.
    await mockAgentsList(page, scenario.agents);
    await mockCredentialsList(page, scenario.credentials);
    await mockListenersList(page, scenario.listeners);
    await mockListenerTemplates(page, scenario.listenerTemplates);
    await mockDashboardOnlyEndpoints(page);
    await mockCheckinsAggregate(page, scenario.checkinAggregate);
    await mockAgentTasksFeed(page, scenario.recentTasks);

    await gotoDocs(page, "/#/");

    // Settle the boot fetch, the force sim, the chart.js canvases and the
    // graph's first-render autofit under the paused clock. gotoDocs already
    // ticked 500ms; this clears the 2000ms autofit + zoom settle.
    await page.clock.runFor(2500);

    // Assert the COUNTS, not the card titles. "Agents"/"Credentials"/
    // "Listeners" are hardcoded toplineMetrics strings that render identically
    // whether the store holds 5 rows or 0, so a title-only check passes on a
    // dashboard whose every stat reads 0 — the one thing this shot must never
    // publish. Dashboard.vue puts the value in p.sk-metric-value with
    // aria-label="<title>: <value>", which getByLabel reads directly.
    await expect(
      page.getByLabel(`Agents: ${scenario.agents.length}`),
    ).toBeVisible();
    await expect(
      page.getByLabel(`Credentials: ${scenario.credentials.length}`),
    ).toBeVisible();
    await expect(
      page.getByLabel(`Listeners: ${scenario.listeners.length}`),
    ).toBeVisible();

    // A drifted-but-200 list response leaves the stats at 0 AND raises
    // Dashboard's own refreshError banner, which countFailedApiResponses
    // (status-based) and consoleGuard (both channels allowlisted) would miss.
    // Matched on role, not `type="error"`: type is a Vuetify prop that maps to
    // colour/icon classes and never reaches the DOM as an attribute, so a
    // [type='error'] selector matches nothing and passes vacuously. VAlert sets
    // role="alert" unconditionally, so any banner is caught.
    await expect(page.getByRole("alert")).toHaveCount(0);

    // Topology drew nodes (graphly-d3 renders each as ".gly-node"); then force
    // a fit so they are centred in the svg — the automatic first-render autofit
    // can settle against a mis-sized svg under the frozen clock — and tick the
    // fit's zoom animation.
    const graph = page.locator('svg[aria-label="Agent topology graph"]');
    await expect(graph).toBeVisible();
    await expect(page.getByText("Failed to load graph data.")).toHaveCount(0);
    await tickUntil(
      page,
      async () => (await graph.locator(".gly-node").count()) > 0,
    );
    // Let the force simulation iterate so the nodes spread out of their initial
    // cluster before fitting (d3-force ticks on rAF, which the paused clock
    // only advances when we tick it).
    await page.clock.runFor(1200);
    // The toolbar's icon buttons expose no text name; Unfocus only renders with
    // a focused node, so "Show All Nodes" is the first toolbar button here.
    // showAllNodes() runs a d3-zoom moveTo *transition*; give it enough ticks
    // to finish, or the graph is captured mid-pan (off-centre).
    await page.locator(".agent-graph__toolbar button").first().click();
    await page.clock.runFor(2000);
    expect(await graph.locator(".gly-node").count()).toBeGreaterThan(0);

    // Doughnut + check-in chart canvases both exist.
    expect(await page.locator("canvas").count()).toBeGreaterThanOrEqual(2);

    // Recent Tasks. Scoped to the card, because agent ids are NOT unique to
    // this table: scenario agents set name === session_id and the topology
    // above renders that name as svg text, so an unscoped
    // getByText("K3H8P2WQ").first() resolves to a graph node and passes with
    // the table empty. `username` appears only in recentTasks, and asserting
    // the rendered relative time pins updated_at — the field whose absence
    // silently renders "a few seconds ago" on every row.
    const recentTasks = page
      .locator(".v-card")
      .filter({ hasText: "Recent Tasks" });
    await expect(recentTasks.getByText("svc_deploy")).toBeVisible();
    await expect(recentTasks.getByText("ACME\\j.mercer")).toBeVisible();
    await expect(recentTasks.getByText("18 minutes ago")).toBeVisible();

    // Size the viewport to the full content height (footer's bottom edge) now
    // that everything is laid out, so the charts below the topology are
    // in-frame, then let the chart.js responsive resize settle.
    const footer = await page.locator(".v-footer").boundingBox();
    await page.setViewportSize({
      width: 1440,
      height: Math.ceil(footer.y + footer.height + 20),
    });
    await page.clock.runFor(500);

    await captureDocsShot(page, "dashboard.png");
  });

  test("users list @docs", async ({ page }) => {
    await seedAdmin(page);
    await mockUsersList(page, scenario.users);

    await gotoDocs(page, "/#/users");

    // Name column: a non-admin username renders as a router-link to the edit
    // route ONLY on the admin path (Users.vue #item.username v-if="isAdmin").
    // Asserting the link therefore guards the Name column AND proves seedAdmin
    // took — without it the cell is a plain <span> and this fails.
    await expect(
      page.getByRole("link", { name: "operator", exact: true }),
    ).toBeVisible();
    // Actions column: the per-row Enabled switch is wrapped in v-if="isAdmin".
    // Its label confirms the admin-gated Actions column rendered.
    await expect(page.getByText("Enabled").first()).toBeVisible();

    await captureDocsShot(page, "users_list.png");
  });

  test("user edit @docs", async ({ page }) => {
    // The New-user form is gated on isNew === ($route.name === "userNew"), so
    // navigate to the NAMED /users/new route, not merely a URL without an id.
    // requiresAdmin on that route needs seedAdmin or the guard blocks it.
    await seedAdmin(page);

    await gotoDocs(page, "/#/users/new");

    // The three New-state markers. Password + Confirm render only when isNew,
    // so asserting them proves the correct route resolved.
    // exact: true on Password/Confirm Password: each field's show/hide toggle
    // icon carries an aria-label of "<Label> appended action" (e.g. "Confirm
    // Password appended action"), which is otherwise a substring match for
    // the same getByLabel call and trips Playwright's strict mode.
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Confirm Password", { exact: true }),
    ).toBeVisible();

    await captureDocsShot(page, "user_edit.png");
  });

  test("notifications @docs", async ({ page }) => {
    await seedNotifications(page, scenario.notifications);

    await gotoDocs(page, "/#/notifications");

    // Title AND the text subtitle. The store field is item.text (NOT
    // item.message); asserting both guards a renamed field publishing blank
    // list rows, matching the check-in notification test's precedent.
    await expect(page.getByText("New Agent", { exact: true })).toBeVisible();
    await expect(
      page.getByText("New Agent 'R9TF6NCV' callback!"),
    ).toBeVisible();

    await captureDocsShot(page, "notifications.png");
  });

  test("settings @docs", async ({ page }) => {
    // With no uploaded avatar the component renders <v-img src="ui-avatars.com
    // /...&background=random">. Fulfill it with a valid local PNG: deterministic,
    // no external dependency, and (unlike route.abort) it does not trip
    // settleImages' broken-asset throw.
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.route("**ui-avatars.com/**", (route) =>
      route.fulfill({ contentType: "image/png", body: png1x1 }),
    );

    await gotoDocs(page, "/#/settings");

    // Top-of-page and bottom-of-page markers. "Reload Plugins" is the last
    // section; asserting it visible proves the clipped capture spans the full
    // content, not just the 720px fold.
    await expect(
      page.getByRole("heading", { name: "Update Password" }),
    ).toBeVisible();
    await expect(page.getByText("Reload Plugins")).toBeVisible();

    // Clip to the content container (Settings.vue's <div class="page">) so the
    // full tall page is captured instead of the top 720px. ".page" is unique
    // across src/ (grep confirmed), so this resolves to exactly one element.
    const pageEl = page.locator(".page");

    // .page (measured ~2000px) exceeds the 720px viewport, so
    // locator.screenshot() would otherwise fall back to CDP's
    // captureBeyondViewport rather than a normal in-viewport capture. As
    // documented for obfuscation_global.png/dashboard.png above, App.vue
    // wraps every real route in a fixed v-app-bar (top) and fixed v-footer
    // (bottom); captureBeyondViewport paints position:fixed chrome at its
    // viewport-relative coordinates onto the oversized canvas instead of
    // scrolling it out of frame. Measured directly here: at the default
    // 720px viewport the fixed chrome was baked into the middle of the
    // capture, stamped over "Clear Application State" and hiding the avatar
    // row entirely under it. Growing the viewport to the page's full
    // height (plus the footer) up front avoids captureBeyondViewport
    // altogether.
    const pageBox = await pageEl.boundingBox();
    const footerBox = await page.locator(".v-footer").boundingBox();
    await page.setViewportSize({
      width: 1440,
      height: Math.ceil(pageBox.y + pageBox.height + footerBox.height + 40),
    });

    await captureDocsShot(page, "settings.png", {
      clip: pageEl,
    });
  });
});
