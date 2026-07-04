// e2e/agent-terminal.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  recordAgentTasks,
} from "./helpers/api/agents.js";
import {
  mockModulesList,
  recordModuleExecutions,
} from "./helpers/api/modules.js";
import { defaultAgents } from "./fixtures/agents.js";

const TEST_MODULE = {
  id: "test_module",
  name: "test_module",
  language: "powershell",
  description: "Test module",
  needs_admin: false,
  opsec_safe: false,
  background: false,
  enabled: true,
  techniques: [],
  options: {
    Agent: { value: "", required: true, description: "Agent" },
    Ratio: { value: "50", required: false, description: "Ratio option" },
  },
};

test.describe("agent terminal", () => {
  const agent = { ...defaultAgents[0], delay: 0 };

  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, agent);
  });

  async function openTerminalTab(page) {
    await page.goto(`/#/agents/${agent.session_id}`);
    // Exact match: once the terminal tab has been visited, its persisted
    // interactTab state means TabbedTerminalContainer mounts eagerly on
    // future loads too, adding its own inner tab labeled "Terminal 1" —
    // a substring match on "Terminal" would then hit both tabs.
    await page.getByRole("tab", { name: "Terminal", exact: true }).click();
    const terminal = page.locator('[data-testid="agent-terminal"]');
    await expect(terminal.locator("input").first()).toBeVisible();
    return terminal;
  }

  test("renders the main-menu prompt with the agent session id, switches to a usemodule prompt", async ({
    page,
  }) => {
    await mockModulesList(page, [TEST_MODULE]);
    const terminal = await openTerminalTab(page);
    await expect(terminal.locator(".prompt")).toContainText(agent.session_id);

    const input = terminal.locator("input").first();
    await input.fill("usemodule test_module");
    await input.press("Enter");

    await expect(terminal.locator(".prompt")).toContainText(
      "usemodule/test_module",
    );
  });

  test("whoami dispatches a shell command against the agent", async ({
    page,
  }) => {
    const tasks = recordAgentTasks(page);
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("whoami");
    await input.press("Enter");

    await expect
      .poll(
        () =>
          tasks.calls.filter(
            (c) =>
              c.url.endsWith("/tasks/shell") && c.body.command === "whoami",
          ).length,
      )
      .toBe(1);
  });

  test("usemodule -> set -> execute runs the module with the overridden option", async ({
    page,
  }) => {
    await mockModulesList(page, [TEST_MODULE]);
    const executions = recordModuleExecutions(page);
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("usemodule test_module");
    await input.press("Enter");
    await input.fill("set Ratio 80");
    await input.press("Enter");
    await expect(terminal.getByText("Set Ratio to 80.")).toBeVisible();
    await input.fill("execute");
    await input.press("Enter");

    await expect.poll(() => executions.calls.length).toBe(1);
    // executeModule() posts { module_id, options, ... } — options are nested,
    // not flattened onto the body (src/api/module-api.js).
    expect(executions.calls[0].body.options.Ratio).toBe("80");
    expect(executions.calls[0].body.options.Agent).toBe(agent.session_id);
  });

  test("help displays the help menu, clear empties the output pane", async ({
    page,
  }) => {
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("whoami");
    await input.press("Enter");
    await expect(terminal.getByText(/whoami/).first()).toBeVisible();

    await input.fill("help");
    await input.press("Enter");
    await expect(terminal.getByText("usemodule").first()).toBeVisible();

    await input.fill("clear");
    await input.press("Enter");
    await expect(terminal.getByText(/whoami/)).toHaveCount(0);
    await expect(terminal.getByText("usemodule")).toHaveCount(0);
  });

  test("history navigation recalls previous commands via ArrowUp/ArrowDown", async ({
    page,
  }) => {
    recordAgentTasks(page);
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("whoami");
    await input.press("Enter");
    await input.fill("ps");
    await input.press("Enter");

    await input.press("ArrowUp");
    await expect(input).toHaveValue("ps");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("whoami");
    await input.press("ArrowDown");
    await expect(input).toHaveValue("ps");
  });

  test("Tab autocompletes a single matching command", async ({ page }) => {
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("wh");
    // The suggestion list is a sibling of the [data-testid="agent-terminal"]
    // container in the DOM (not a descendant), so it must be queried at the
    // page level rather than scoped to `terminal`.
    await expect(
      page.locator(".suggestion", { hasText: "whoami" }),
    ).toBeVisible();

    await input.press("Tab");
    await expect(input).toHaveValue("whoami");
    // Completing to "whoami" still fuzzy-matches the "whoami" command itself,
    // so the currentInput watcher regenerates the same single suggestion
    // rather than clearing the list — the dropdown does not auto-close here.
    await expect(page.locator(".suggestion")).toHaveCount(1);
  });

  test("sysinfo and jobs dispatch their respective tasks", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    await input.fill("sysinfo");
    await input.press("Enter");
    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/sysinfo")).length,
      )
      .toBe(1);

    await input.fill("jobs");
    await input.press("Enter");
    await expect
      .poll(
        () => tasks.calls.filter((c) => c.url.endsWith("/tasks/jobs")).length,
      )
      .toBe(1);
  });

  test("appending output scrolls the output pane to the bottom", async ({
    page,
  }) => {
    recordAgentTasks(page);
    const terminal = await openTerminalTab(page);
    const input = terminal.locator("input").first();

    // Push enough lines to overflow the fixed-height output pane.
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await input.fill(`whoami ${i}`);
      // eslint-disable-next-line no-await-in-loop
      await input.press("Enter");
    }

    const output = terminal.locator(".terminal-output");
    await expect
      .poll(async () =>
        output.evaluate(
          (el) => el.scrollHeight - el.scrollTop - el.clientHeight,
        ),
      )
      .toBeLessThanOrEqual(1);
  });

  test("output history persists across reload but typed commands are not separately persisted", async ({
    page,
  }) => {
    recordAgentTasks(page);
    await openTerminalTab(page);

    // AgentTerminal is mounted inside TabbedTerminalContainer, which always
    // passes a tabId prop (default first tab id is 1), so storageName()
    // appends "-1" — see AgentTerminal.vue's storageName().
    const storageKey = `terminal-history-${agent.session_id}-1`;
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: storageKey,
      value: JSON.stringify([
        { content: "PRELOADED_MARKER_LINE", cssClasses: "preserve-newlines" },
      ]),
    });

    // Switch off the Terminal tab before reloading. AgentEdit.vue persists
    // the active interact-tab and restores it as the *initial* v-model value
    // on the next load, which would otherwise mount AgentTerminal (via
    // TabbedTerminalContainer) as part of that first render -- before
    // AgentEdit's own getAgent() has resolved (see
    // e2e/agent-shell-session.spec.js's equivalent test for the same
    // mount-ordering bug in AgentEdit.vue, confirmed there for Shell).
    // AgentTerminal doesn't currently hit this: its mounted() awaits
    // getModules/getListeners/getBypasses before calling loadHistory(),
    // and that window reliably lets getAgent() resolve first. But that's
    // timing, not structural -- switching to Module first keeps "module"
    // as the persisted interactTab so Terminal only (re)mounts later, in
    // response to openTerminalTab's own explicit click, making this robust
    // against a future mounted() reordering that would reintroduce the bug.
    await page.locator(".v-tab", { hasText: /module/i }).click();

    await page.reload();
    let terminal = await openTerminalTab(page);
    // Positive control: loadHistory still loads what was there before.
    await expect(terminal.getByText("PRELOADED_MARKER_LINE")).toBeVisible();

    const input = terminal.locator("input").first();
    await input.fill("whoami");
    await input.press("Enter");
    await expect(terminal.getByText(/whoami/).first()).toBeVisible();
    // pollForResult() is fire-and-forget (runShellCommand doesn't await it),
    // so the shell task's async POST/poll round-trip can still be in flight
    // here. Wait for its completion line before reloading, otherwise the
    // reload aborts the in-flight fetch and trips the consoleGuard fixture.
    await expect(
      terminal.getByText(/Task .* \(shell\) completed/),
    ).toBeVisible();

    // Switch off Terminal again before the second reload, for the same
    // eager-mount reason as above.
    await page.locator(".v-tab", { hasText: /module/i }).click();

    await page.reload();
    terminal = await openTerminalTab(page);
    await expect(terminal.getByText("PRELOADED_MARKER_LINE")).toBeVisible();
    // Typed output never gets separately persisted (shallow-watch behavior).
    await expect(terminal.getByText(/whoami/)).toHaveCount(0);
  });
});
