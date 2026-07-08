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
import { jsonResponse } from "./helpers/responses.js";

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

  // Regression test: AgentInteract's submit() had no guard against a second
  // submission firing while the first was still in flight. Vuetify already
  // sets `pointer-events: none` on the button while `:loading` is true, so a
  // second *click* can never reach it either way -- that's not the bypass.
  // The actual bypass is keyboard-triggered submission: pressing Enter in
  // the "Shell Command" text field submits the form directly, without ever
  // touching the (possibly loading/disabled) button. The shell POST is held
  // open (gated) so the second Enter press has a real window to fire a
  // duplicate request in before the first one resolves.
  test("pressing Enter again while a shell command is in flight does not queue it twice", async ({
    page,
  }) => {
    await page.goto("/#/agents-graph");
    const graph = page.locator(".agent-graph");
    await graph.getByText("renamed-agent").click({ button: "right" });
    await page.getByText("Execute shell").click();

    const commandInput = page.getByLabel("Shell Command");
    await expect(commandInput).toBeVisible();
    await commandInput.fill("whoami");

    let releaseShell;
    const shellGate = new Promise((resolve) => {
      releaseShell = resolve;
    });
    const calls = [];
    await page.route("**/api/v2/agents/*/tasks/shell", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      calls.push(route.request().url());
      await shellGate;
      return route.fulfill(jsonResponse({ id: 1, status: "queued" }, 201));
    });

    const firstRequest = page.waitForRequest("**/api/v2/agents/*/tasks/shell");
    await commandInput.press("Enter");
    await firstRequest;

    // The text field itself is never disabled, so a second Enter press
    // still reaches submit() while the first request is still pending.
    await commandInput.press("Enter");

    releaseShell();
    await expect(page.getByText(/shell command queued/i)).toBeVisible();
    expect(calls.length).toBe(1);
  });
});
