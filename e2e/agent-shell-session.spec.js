// e2e/agent-shell-session.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  recordAgentTasks,
} from "./helpers/api/agents.js";
import { defaultAgents } from "./fixtures/agents.js";

test.describe("agent shell session", () => {
  // delay=0 makes pollDelay clamp to 1s (the floor in pollForResult), so the
  // background updateCurrentDirectory poll plus the user-command poll each
  // take ~1s instead of the 5s default.
  const agent = { ...defaultAgents[0], delay: 0 };

  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // mockAgentDetailSubResources stubs the /tasks/shell POST with a completed
    // task, but recordAgentTasks (registered after) wins under Playwright's
    // LIFO route order. The single-task GET stub still serves both polls.
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, agent);
  });

  test("submits shell command from terminal input", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);

    // Switch to the Shell tab inside the Interact panel.
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    const shell = page.locator('[data-testid="agent-shell"]');
    await expect(shell).toBeVisible();

    // Type a command and press Enter.
    const input = shell.locator("input").first();
    await input.fill("whoami");
    await input.press("Enter");

    // The user command echo appears in the terminal output.
    await expect(shell.getByText(/whoami/).first()).toBeVisible();

    // The shell POST for our command lands at /tasks/shell with body.command="whoami".
    // The initial updateCurrentDirectory poll also POSTs to /tasks/shell with
    // a directory probe — filter to ours.
    await expect
      .poll(
        () =>
          tasks.calls.filter(
            (c) =>
              c.url.endsWith("/tasks/shell") && c.body.command === "whoami",
          ).length,
      )
      .toBe(1);
    const call = tasks.calls.find(
      (c) => c.url.endsWith("/tasks/shell") && c.body.command === "whoami",
    );
    expect(call.body.literal).toBe(false);
  });

  test("sysinfo runs the sysinfo task", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    const shell = page.locator('[data-testid="agent-shell"]');
    const input = shell.locator("input").first();

    await input.fill("sysinfo");
    await input.press("Enter");

    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/sysinfo")).length,
      )
      .toBe(1);
  });

  test("cd sends a shell command for the new directory", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    const shell = page.locator('[data-testid="agent-shell"]');
    const input = shell.locator("input").first();

    await input.fill("cd C:\\Users\\test");
    await input.press("Enter");

    await expect
      .poll(
        () =>
          tasks.calls.filter(
            (c) =>
              c.url.endsWith("/tasks/shell") &&
              c.body.command === "cd C:\\Users\\test",
          ).length,
      )
      .toBe(1);
  });

  test("history navigation recalls previous commands via ArrowUp/ArrowDown", async ({
    page,
  }) => {
    recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    const shell = page.locator('[data-testid="agent-shell"]');
    const input = shell.locator("input").first();

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

  test("surfaces an error when a shell command fails", async ({ page }) => {
    // A real non-2xx HTTP response (e.g. status: 500 with a JSON error body,
    // as originally drafted for this test) makes Chromium itself log an
    // un-catchable, browser-level "Failed to load resource: the server
    // responded with a status of 500" console error. The shared consoleGuard
    // fixture (e2e/fixtures/test.js) only allowlists that message for the
    // /token 401 case (login.spec.js), not generically, so this test would
    // fail on the fixture's guard regardless of how AgentShellSession itself
    // handles the error. Exercise the identical catch -> addError() code path
    // via a 200 response with an unparsable body instead: http.js's
    // safeParse() throws "Malformed JSON in 200 response" for a non-JSON
    // body on an *ok* response, which agent-task-api.js's shell() still
    // routes through handleError() -> addError() the same way a real
    // rejection would, without Chromium treating the HTTP transaction itself
    // as failed.
    await page.route("**/api/v2/agents/*/tasks/shell", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const body = JSON.parse(route.request().postData() || "{}");
      if (body.command !== "failcmd") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "not-json",
      });
    });
    await page.goto(`/#/agents/${agent.session_id}`);
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    const shell = page.locator('[data-testid="agent-shell"]');
    const input = shell.locator("input").first();

    await input.fill("failcmd");
    await input.press("Enter");

    await expect(shell.getByText(/Error executing command/)).toBeVisible();
  });

  test("output history persists across reload but typed commands are not separately persisted", async ({
    page,
  }) => {
    await page.goto(`/#/agents/${agent.session_id}`);
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    await expect(
      page.locator('[data-testid="agent-shell"] input').first(),
    ).toBeVisible();

    const storageKey = `shell-session-${agent.session_id}`;
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: storageKey,
      value: JSON.stringify([
        { content: "PRELOADED_MARKER_LINE", cssClasses: "preserve-newlines" },
      ]),
    });

    // Switch off the Shell tab before reloading. AgentEdit.vue persists the
    // active interact-tab to localStorage and restores it as the *initial*
    // v-model value on the next load (`interactTab: localStorage.getItem(...)`
    // in data()). If "shell" were left as the persisted tab, AgentShellSession
    // would mount as part of that very first render — as a child, it mounts
    // before AgentEdit's own mounted() hook fires (Vue mounts children before
    // parents), i.e. before AgentEdit's getAgent() has resolved and replaced
    // the placeholder `agent: {}`. AgentShellSession's storageName() reads
    // `this.agent.session_id` at that moment, which is undefined, so it
    // reads/writes "shell-session-undefined" instead of the real key — the
    // real key's content (including PRELOADED_MARKER_LINE) never loads, and
    // this is 100% reproducible, not a rare race (verified empirically: the
    // terminal renders completely empty after a reload with Shell as the
    // already-active tab, even though localStorage still holds the marker
    // untouched). Switching to Module first keeps "module" as the persisted
    // interactTab, so Shell only (re)mounts later in response to our explicit
    // click below — well after `agent` has resolved — matching how the tab
    // behaves on a first-ever visit.
    await page.locator(".v-tab", { hasText: /module/i }).click();

    await page.reload();
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    let shell = page.locator('[data-testid="agent-shell"]');
    // Positive control: loadHistory still loads what was there before.
    await expect(shell.getByText("PRELOADED_MARKER_LINE")).toBeVisible();

    const input = shell.locator("input").first();
    await input.fill("whoami");
    await input.press("Enter");
    await expect(shell.getByText(/whoami/).first()).toBeVisible();
    // shellCommandOperator() awaits pollForResult({ print: false }) itself,
    // but nothing in the test awaits shellCommandOperator's promise (Enter's
    // keyup handler just fires processCommand and returns) — so the
    // POST /tasks/shell -> poll GET /tasks/{id} round trip can still be
    // in flight here, same class of race as AgentTerminal (Task 1). Unlike
    // AgentTerminal, pollForResult runs with print:false for user shell
    // commands, so no "Task ... completed" line is ever rendered; the only
    // observable completion signal is the raw command-output line that
    // shellCommandOperator appends with cssClasses "indent-5-spaces" once
    // the poll resolves. Wait for that before reloading, otherwise the
    // reload aborts the in-flight fetch and trips the consoleGuard fixture.
    await expect(shell.locator(".indent-5-spaces").last()).toBeVisible();

    // Switch off Shell again before the second reload, for the same
    // eager-mount reason as above -- otherwise neither PRELOADED_MARKER_LINE
    // nor the shallow-watch assertion below would mean what they say.
    await page.locator(".v-tab", { hasText: /module/i }).click();

    await page.reload();
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    shell = page.locator('[data-testid="agent-shell"]');
    await expect(shell.getByText("PRELOADED_MARKER_LINE")).toBeVisible();
    // Typed output never gets separately persisted: addLine() pushes onto
    // outputLines in place, and the `watch: { outputLines() {...} }` handler
    // has no `deep: true`, so it only fires on a full reassignment of
    // outputLines (e.g. mounted()'s initial load, or "clear"), never on
    // .push(). The localStorage entry written on mount is therefore never
    // updated with anything typed during the session.
    await expect(shell.getByText(/whoami/)).toHaveCount(0);
  });
});
