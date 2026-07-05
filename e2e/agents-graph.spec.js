// e2e/agents-graph.spec.js
//
// Regression smoke for the standalone /agents-graph page, which the
// graph-on-dashboard PR rewired into a thin shell over AgentGraph.vue.
// Node titles are real SVG <text> elements (src/graph/computer.js renders
// payload.title), so plain text locators work.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockAgentsList } from "./helpers/api/agents.js";
import {
  mockListenersList,
  mockListenerTemplates,
} from "./helpers/api/listeners.js";
import { defaultAgents } from "./fixtures/agents.js";
import { defaultListeners, httpTemplate } from "./fixtures/listeners.js";

test.describe("agents graph page", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockListenersList(page, defaultListeners);
    await mockListenerTemplates(page, [httpTemplate]);
    await mockAgentsList(page, defaultAgents);
  });

  test("renders listener and agent topology nodes", async ({ page }) => {
    await page.goto("/#/agents-graph");
    const graph = page.locator(".agent-graph");
    await expect(graph.getByText("http-1", { exact: true })).toBeVisible();
    await expect(graph.getByText("http-2-stopped")).toBeVisible();
    for (const agent of defaultAgents) {
      await expect(graph.getByText(agent.name)).toBeVisible();
    }
  });

  test("right-clicking an agent node opens its context menu", async ({
    page,
  }) => {
    await page.goto("/#/agents-graph");
    const graph = page.locator(".agent-graph");
    await graph.getByText("renamed-agent").click({ button: "right" });
    // The v-menu teleports to the overlay container, so don't scope to graph.
    await expect(page.getByText("Execute shell")).toBeVisible();
    await expect(page.getByText("Kill", { exact: true })).toBeVisible();
  });
});
