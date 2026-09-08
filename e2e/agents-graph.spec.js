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
import { defaultAgents, pivotedAgent } from "./fixtures/agents.js";
import {
  defaultListeners,
  httpTemplate,
  pivotListener,
  smbTemplate,
} from "./fixtures/listeners.js";
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

  // A peer-to-peer relay is not a top-level C2 endpoint -- it runs *on* an
  // agent, so the graph hides the relay's own listener node and chains the
  // agent behind it off its host agent instead. This is the first e2e coverage
  // of that path; its absence is why the detection break shipped unnoticed.
  test("hides a peer-to-peer relay listener and still shows the agent behind it", async ({
    page,
  }) => {
    await mockListenersList(page, [...defaultListeners, pivotListener]);
    await mockListenerTemplates(page, [httpTemplate, smbTemplate]);
    await mockAgentsList(page, [...defaultAgents, pivotedAgent]);

    await page.goto("/#/agents-graph");
    const graph = page.locator(".agent-graph");

    // Ordinary listeners still render...
    await expect(graph.getByText("http-1", { exact: true })).toBeVisible();
    // ...the agent reached through the relay renders...
    await expect(graph.getByText("pivoted-agent")).toBeVisible();
    // ...as does the agent hosting the relay...
    await expect(graph.getByText("ABC12345")).toBeVisible();
    // ...but the relay listener itself must never appear as its own node.
    await expect(graph.getByText("smb-pivot-1")).toHaveCount(0);

    // Hiding the relay is only half the fix: the pivoted agent must chain off
    // its HOST agent, not dangle. graphly-d3 gives links a random data-id, so
    // the edge can't be selected by name -- assert the edge count instead,
    // which is what separates "chained" from "orphaned". One link per visible
    // listener (to root), one per defaultAgent (to its listener), plus one for
    // pivoted-agent chaining to its host. Derived rather than hardcoded because
    // defaultListeners/defaultAgents are shared with 15 other specs: a fixture
    // gaining an entry should not read as a pivot regression here. If the chain
    // regressed to an orphan this is one fewer; if the relay node came back,
    // one more.
    const expectedLinks = defaultListeners.length + defaultAgents.length + 1;
    await expect(graph.locator('[data-object="link"]')).toHaveCount(
      expectedLinks,
    );
    // And the relay must not be a node under root by id either, not just by
    // rendered label.
    await expect(graph.locator('[data-id="listener_smb-pivot-1"]')).toHaveCount(
      0,
    );
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
