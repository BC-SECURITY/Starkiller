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
import { mockStagersList } from "../helpers/api/stagers.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
} from "../helpers/api/agents.js";
import { mockMalleableProfilesList } from "../helpers/api/malleable.js";
import { mockModulesList, mockModuleDetail } from "../helpers/api/modules.js";
import {
  mockPluginMarketplace,
  mockPluginDetail,
} from "../helpers/api/plugins.js";
import { seedNotifications } from "../helpers/api/notifications.js";
import { scenario } from "./scenario.js";
import {
  prepareDocsPage,
  mockDocsBackground,
  captureDocsShot,
  closeDocsOverlay,
  tickUntil,
  tickUntilTabStripSized,
  countFailedApiResponses,
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
    // A second column, distinct from Name: options.Host renders in the Host
    // column — a renamed `options.Host` would otherwise publish a blank cell
    // with a green gate.
    await expect(page.getByText("http://192.0.2.10").first()).toBeVisible();
    await captureDocsShot(page, "listeners_tab.png");
  });

  test("stagers list @docs", async ({ page }) => {
    await mockStagersList(page, scenario.stagers);
    await page.goto("/#/stagers");
    await expect(
      page.getByText("acme-powershell-launcher").first(),
    ).toBeVisible();
    // A second column, distinct from Name: `template` renders in the Type
    // column.
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

    await page.goto(`/#/modules/${scenario.modules[0].id}`);
    await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();

    // Select three agents to show multi-agent tasking. Must be same-language
    // agents: AgentExecuteModule.vue's compatibleModules computed intersects
    // each selected agent's language, and scenario.modules[0] is
    // powershell-only — mixing in a python agent (the scenario has 3
    // powershell agents and 2 python) renders a red "No modules are compatible
    // with all selected agents" banner instead of a working demo. Selected by
    // session_id
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

    await page.goto(`/#/listeners/${scenario.listeners[0].id}?tab=autorun`);

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

  test("plugin marketplace @docs", async ({ page }) => {
    await mockPluginMarketplace(page, scenario.marketplace);

    await page.goto("/#/plugin-marketplace");

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
    await page.goto(`/#/plugins/${scenario.plugins[0].id}?tab=details`);

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

  test("malleable profiles list @docs", async ({ page }) => {
    await mockMalleableProfilesList(page, scenario.malleableProfiles);

    await page.goto("/#/malleable-profiles");

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

  test("malleable listener form @docs", async ({ page }) => {
    const malleable = scenario.listenerTemplates[1];
    await mockGeneralFormBackground(page);
    await mockListenerTemplates(page, scenario.listenerTemplates);
    await mockListenerTemplate(page, malleable);

    // /listeners/new has no listener to fetch — only the template list. The
    // type dropdown drives the template detail fetch.
    await page.goto("/#/listeners/new");

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

    await page.goto(`/#/agents/${agent.session_id}`);

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

    // The module picker must be populated, not merely present — but its
    // `getByPlaceholder("Search module...")` can never be used for that:
    // AgentExecuteModule initializes `selectedModule: ""` rather than
    // `null`, and VAutocomplete's isDirty is `model.value.length > 0`.
    // Vuetify's transformIn wraps any non-nullish model value (including
    // "") into a one-element array, so isDirty is true — and therefore the
    // placeholder is suppressed (`isDirty ? undefined : props.placeholder`)
    // — from the very first render, permanently, regardless of whether
    // modules have loaded. Verified via the rendered <input>: it never
    // carries a placeholder attribute at all. So prove population by
    // opening the picker and asserting a real module id renders as an
    // option, then close it the same way the multi-agent-tasking and
    // malleable-listener tests above close their dropdowns before
    // capturing.
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

  test("agent check-in notification @docs", async ({ page }) => {
    await seedNotifications(page, scenario.notifications);
    await mockAgentsList(page, scenario.agents);

    await page.goto("/#/agents");

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

    // VMenu's default transition is VDialogTransition (dialog-transition.js),
    // whose onEnter (a) awaits two requestAnimationFrame ticks, then (b)
    // calls the native Element.animate() WAAPI method to scale/fade the
    // overlay in over ~225ms. Confirmed by reading dialog-transition.js
    // directly — it has no reference to openDelay at all; that's a VMenu
    // activation concept (useActivator.js) that only runs on the
    // hover/focus paths (via runOpenDelay() from onMouseenter/onFocus). This
    // bell is a plain click activator with no open-on-hover/open-on-focus,
    // so isActive flips synchronously in the onClick handler and openDelay
    // never gates anything here. None of the animation is a CSS transition
    // or CSS animation — prepareDocsPage's `transition:none!important`
    // override has no effect on it (measured: getComputedStyle(overlay)
    // .transition/.animation both read "none" the entire time, while
    // .transform kept interpolating). And it isn't the same rAF-driven
    // virtual-scroller populate mechanism the autocomplete dropdowns above
    // depend on either — WAAPI's Element.animate() runs against
    // document.timeline, not the page's overridden
    // window.requestAnimationFrame, so ticking the fake clock only
    // (page.clock.runFor) let it drift for many ticks without ever
    // reliably reaching completion within this file's usual 500ms budget
    // (measured across several runs: still short of the fully-expanded
    // ~177px content height after as much as 1500ms of fake time).
    //
    // So instead of waiting it out, finish it directly: tickUntil
    // Element.animate() has actually been called — it hasn't yet immediately
    // after bell.click(), since the two rAF awaits haven't resolved
    // (root-cause candidate for the remaining delay, not chased further) —
    // then call Animation.finish() on every in-flight animation to jump
    // straight to the end state. A poll timeout here means those rAF awaits
    // never resolved.
    await tickUntil(
      page,
      async () =>
        (await page.evaluate(() => document.getAnimations().length)) > 0,
    );
    // dialog-transition.js starts one animation on the overlay itself plus
    // a separate per-child opacity animation for each list/card child
    // (getChildren().forEach(...)) — finish() every in-flight animation,
    // not just the first found, then give the DOM one more tick to reflect
    // onEnter's post-animation cleanup (removing the temporary inline
    // pointer-events/visibility styles onBeforeEnter set).
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
    // what this image shows, and every other full-page shot in the set is
    // 2880x1440 (plugin-dependencies.png is the one deliberate element clip).
    await captureDocsShot(page, "starkiller_checkin.png");
  });
});
