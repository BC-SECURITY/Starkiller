// e2e/dashboard.spec.js
//
// Smoke coverage for the Dashboard: metric tiles, the Topology graph panel
// (added by the graph-on-dashboard PR), its context menu, the fullscreen
// overlay's Escape behavior, and error isolation (a graph-data failure must
// not break the rest of the dashboard).
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { mockAgentsList } from "./helpers/api/agents.js";
import {
  mockListenersList,
  mockListenerTemplates,
} from "./helpers/api/listeners.js";
import { mockCredentialsList } from "./helpers/api/credentials.js";
import { paginatedResponse } from "./helpers/responses.js";
import { defaultAgents } from "./fixtures/agents.js";
import { defaultListeners, httpTemplate } from "./fixtures/listeners.js";

// Endpoints only the Dashboard hits, stubbed empty inline:
// - GET /agents/tasks (Recent Tasks table, plus its auto-refresh poller)
// - GET /agents/checkins/ and /agents/checkins/aggregate (Check Ins chart);
//   regex because the endpoint has both a trailing-slash and a nested form,
//   which a single glob can't cover (* doesn't cross "/").
async function mockDashboardOnlyEndpoints(page) {
  await page.route("**/api/v2/agents/tasks*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route(/\/api\/v2\/agents\/checkins\//, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

// The Dashboard stacks tiles above the Topology card; on the default 720px
// viewport the graph canvas sits below the fold and SVG nodes aren't
// clickable. A taller viewport keeps the panel and its nodes interactable.
test.use({ viewport: { width: 1280, height: 1600 } });

// Right-click an SVG text node by label via a synthetic contextmenu event.
// In the Dashboard overlay, d3-zoom's auto-fit transform can park nodes far
// outside the viewport (e.g. renamed-agent renders at screen-x ≈ -13000), so
// Playwright's .click() refuses with "element is outside of the viewport"
// after scroll-into-view — it honors the post-transform getBoundingClientRect.
// dispatchEvent fires directly on the element, bypassing the viewport check.
// (A plain right-click DOES work on the standalone /agents-graph page, where
// the node happens to land on-screen — see e2e/agents-graph.spec.js.)
// Caveat: because the dispatched clientX/clientY can be off-screen, the
// v-menu may also open off-screen; the menu assertions verify the handler
// fires and menuItems filters correctly (DOM presence), NOT that the menu is
// positioned where a real user would see it.
async function rightClickSvgText(page, label) {
  await page.evaluate((text) => {
    const el = [...document.querySelectorAll("text")].find(
      (t) => t.textContent.trim() === text,
    );
    if (!el) throw new Error(`SVG text not found: ${text}`);
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: cx,
        clientY: cy,
      }),
    );
  }, label);
}

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockTagsEndpoint(page);
    await mockDashboardOnlyEndpoints(page);
    await mockCredentialsList(page, []);
    await mockListenersList(page, defaultListeners);
    await mockListenerTemplates(page, [httpTemplate]);
    await mockAgentsList(page, defaultAgents);
  });

  test("renders metric tiles and topology nodes", async ({ page }) => {
    await page.goto("/#/dashboard");
    // Metric tiles expose `${title}: ${value}` as aria-labels.
    await expect(page.getByLabel("Agents: 3")).toBeVisible();
    await expect(page.getByLabel("Credentials: 0")).toBeVisible();
    await expect(page.getByLabel("Listeners: 2")).toBeVisible();
    // Topology panel: node titles are SVG <text> elements. Both fixture
    // listeners render (enabled state does not filter the graph).
    const graph = page.locator(".agent-graph");
    await expect(graph.getByText("http-1", { exact: true })).toBeVisible();
    await expect(graph.getByText("http-2-stopped")).toBeVisible();
    for (const agent of defaultAgents) {
      await expect(graph.getByText(agent.name)).toBeVisible();
    }
  });

  // Step C: bounded-card right-click is skipped — d3-zoom parks nodes off-screen
  // in this layout (see rightClickSvgText comment). Context-menu assertions are
  // tested via the expanded overlay below; the bounded card is render-only.
  test("right-clicking an agent node opens the agent context menu", async ({
    page,
  }) => {
    await page.goto("/#/dashboard");
    const graph = page.locator(".agent-graph");

    // Expand to fullscreen: the overlay fills the viewport and the component
    // auto-refits ~50ms after expanding, rendering nodes in the visible area.
    // The expand toggle is the toolbar's last button (template order:
    // [Unfocus when focused], Show All Nodes, Fullscreen/Collapse).
    await page.locator(".agent-graph__toolbar button").last().click();
    await expect(page.locator(".agent-graph--expanded")).toBeVisible();

    // Wait for the auto-refit (~50ms), then dispatch contextmenu via
    // rightClickSvgText (see helper comment for why .click() is not used).
    await expect(graph.getByText("renamed-agent")).toBeVisible();
    await rightClickSvgText(page, "renamed-agent");

    // The v-menu teleports to the overlay container, so don't scope to graph.
    await expect(page.getByText("Open", { exact: true })).toBeVisible();
    await expect(page.getByText("Open in new tab")).toBeVisible();
    await expect(page.getByText("Execute shell")).toBeVisible();
    await expect(page.getByText("Execute module")).toBeVisible();
    await expect(page.getByText("Kill", { exact: true })).toBeVisible();
    // Focus is listener-only; it must not appear on an agent node.
    await expect(page.getByText("Focus", { exact: true })).toBeHidden();
    // Escape closes the menu; the overlay stays expanded (guard not triggered
    // until menu is gone).
    await page.keyboard.press("Escape");
    await expect(page.getByText("Execute shell")).toBeHidden();
    await expect(page.locator(".agent-graph--expanded")).toBeVisible();
  });

  test("expand, Escape guard, collapse", async ({ page }) => {
    await page.goto("/#/dashboard");
    const graph = page.locator(".agent-graph");
    await expect(graph.getByText("renamed-agent")).toBeVisible();

    // The expand toggle is the toolbar's last button (template order:
    // [Unfocus when focused], Show All Nodes, Fullscreen/Collapse).
    await page.locator(".agent-graph__toolbar button").last().click();
    await expect(page.locator(".agent-graph--expanded")).toBeVisible();

    // Open the context menu on top of the expanded overlay.
    // Wait for the auto-refit (~50ms), then dispatch contextmenu via
    // rightClickSvgText (see helper comment for why .click() is not used).
    await expect(graph.getByText("renamed-agent")).toBeVisible();
    await rightClickSvgText(page, "renamed-agent");
    await expect(page.getByText("Execute shell")).toBeVisible();

    // First Escape closes only the menu; the overlay must stay expanded
    // (the Section A guard in AgentGraph.onKeydown).
    await page.keyboard.press("Escape");
    await expect(page.getByText("Execute shell")).toBeHidden();
    await expect(page.locator(".agent-graph--expanded")).toBeVisible();

    // Second Escape collapses the overlay.
    await page.keyboard.press("Escape");
    await expect(page.locator(".agent-graph--expanded")).toHaveCount(0);
  });

  test("an agents failure shows the panel error state without breaking the rest", async ({
    page,
  }) => {
    // Registered after the beforeEach mocks: Playwright routes are LIFO, so
    // this 500 wins for the agents *list* GET (sub-paths still fall back).
    await page.route("**/api/v2/agents*", (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() !== "GET") return route.fallback();
      if (url.pathname.match(/\/agents\/[^/]+/)) return route.fallback();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });
    await page.goto("/#/dashboard");
    // The panel shows its own error state...
    await expect(page.getByText("Failed to load graph data.")).toBeVisible();
    // ...the Dashboard surfaces its per-leg refresh error...
    await expect(page.getByText(/Refresh failed/)).toBeVisible();
    // ...and the rest of the dashboard still works. (The Agents tile
    // legitimately shows 0 here, so only the healthy legs are asserted.)
    await expect(page.getByLabel("Credentials: 0")).toBeVisible();
    await expect(page.getByLabel("Listeners: 2")).toBeVisible();
  });
});
