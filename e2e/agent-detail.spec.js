// e2e/agent-detail.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
} from "./helpers/api/agents.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import { defaultAgents } from "./fixtures/agents.js";

// The upload/download/clear-queue/kill actions live behind the ellipsis-v
// menu in the agent toolbar.
async function openAgentMenu(page) {
  await page.locator("button:has(.fa-ellipsis-v)").click();
}

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

  // Regression test: killAgent() used to fire the exit task without await,
  // show an unconditional success toast, and navigate away immediately —
  // so a failed kill request was invisible and the operator was already on
  // the agents list before it could possibly have failed.
  test("kill agent surfaces an error and does not navigate away on failure (regression: unawaited kill + premature navigation)", async ({
    page,
  }) => {
    await page.route("**/api/v2/agents/*/tasks/exit", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });

    await page.goto(`/#/agents/${defaultAgents[0].session_id}`);
    await openAgentMenu(page);
    await page
      .locator(".v-list-item")
      .filter({ hasText: /^Kill Agent$/ })
      .click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect(page.getByText(/failed to kill agent/i)).toBeVisible();
    // Still on the agent detail page — did not navigate to the agents list.
    await expect(page).toHaveURL(
      new RegExp(`#/agents/${defaultAgents[0].session_id}$`),
    );
  });

  // Regression test: clearQueue() (the store action) used to fire per-task
  // deletes with an unawaited forEach, so awaiting the call site alone
  // (without also fixing the store action) would have been cosmetic — the
  // await would resolve immediately regardless of what the deletes did.
  test("clear queue surfaces a partial-failure error (regression: clearQueue store action was fire-and-forget)", async ({
    page,
  }) => {
    await page.route("**/api/v2/agents/*/tasks*", (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() !== "GET") return route.fallback();
      if (url.searchParams.get("status") !== "queued") return route.fallback();
      return route.fulfill(paginatedResponse([{ id: 1 }, { id: 2 }]));
    });
    const deleted = [];
    await page.route("**/api/v2/agents/*/tasks/*", (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      const taskId = route
        .request()
        .url()
        .match(/\/tasks\/(\d+)$/)?.[1];
      deleted.push(taskId);
      if (taskId === "2") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "boom" }),
        });
      }
      return route.fulfill(jsonResponse({}, 204));
    });

    await page.goto(`/#/agents/${defaultAgents[0].session_id}`);
    await openAgentMenu(page);
    await page
      .locator(".v-list-item")
      .filter({ hasText: /^Clear Queued Tasks$/ })
      .click();
    await page.getByRole("button", { name: "Yes" }).click();

    // Both deletes still go out — one task's failure doesn't stop the other.
    await expect.poll(() => deleted.length).toBe(2);
    await expect(
      page.getByText(/failed to clear 1 of 2 queued tasks/i),
    ).toBeVisible();
  });
});
