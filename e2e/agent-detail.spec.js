// e2e/agent-detail.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
} from "./helpers/api/agents.js";
import { defaultAgents } from "./fixtures/agents.js";

test.describe("agent detail", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Sub-resource mocks: modules (AgentExecuteModule tab), shell task
    // (AgentShellSession.updateCurrentDirectory), and task list poller.
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, defaultAgents[0]);
  });

  test("renders agent metadata", async ({ page }) => {
    await page.goto(`/#/agents/${defaultAgents[0].session_id}`);
    // The agent name appears in the breadcrumb bar at the top of the detail page.
    await expect(page.getByText(defaultAgents[0].name).first()).toBeVisible();
    // The hostname is shown on the View tab's agent form.
    await page.locator(".v-tab", { hasText: /view/i }).click();
    await expect(
      page.getByText(defaultAgents[0].hostname).first(),
    ).toBeVisible();
  });

  test("terminal and shell tabs both render (regression: 441555b7)", async ({
    page,
  }) => {
    await page.goto(`/#/agents/${defaultAgents[0].session_id}`);
    // Click Terminal tab (inside the Interact sub-tab bar) and confirm the
    // AgentTerminal-specific container renders. Both AgentTerminal.vue and
    // AgentShellSession.vue share the class "terminal-container", so we
    // distinguish them with data-testid attributes added to each component.
    await page.locator(".v-tab", { hasText: /terminal/i }).click();
    await expect(page.locator('[data-testid="agent-terminal"]')).toBeVisible();
    // Shell-specific container must NOT be visible on the Terminal tab.
    await expect(page.locator('[data-testid="agent-shell"]')).not.toBeVisible();

    // Click Shell tab and confirm its distinct container renders.
    await page.locator(".v-tab", { hasText: /shell/i }).click();
    await expect(page.locator('[data-testid="agent-shell"]')).toBeVisible();
  });
});
