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
});
