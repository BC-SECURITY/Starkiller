// e2e/agent-jobs.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
} from "./helpers/api/agents.js";
import { defaultAgents } from "./fixtures/agents.js";

// AgentJobs polls getTask after POSTing /tasks/jobs. delay=0 clamps the
// per-iteration pollDelay to 1s (the inline `Math.max(..., 1000)` floor in
// AgentJobs.refreshJobs), so the first poll succeeds in ~1s instead of 5s.
const agent = { ...defaultAgents[0], delay: 0 };

test.describe("agent jobs tab", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, agent);
  });

  test("renders Background Jobs panel and triggers a getJobs POST", async ({
    page,
  }) => {
    const jobsPostCalls = [];
    // Records POST /agents/*/tasks/jobs (the getJobs trigger).
    await page.route("**/api/v2/agents/*/tasks/jobs", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      jobsPostCalls.push(route.request().url());
      return route.fulfill(jsonResponse({ id: 42, output: "" }, 201));
    });
    // The poll fetches GET /tasks/42 — return parseable output with no
    // active jobs so the panel renders the "no data" empty state quickly.
    await page.route("**/api/v2/agents/*/tasks/42", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(
        jsonResponse({
          id: 42,
          output: "Task ID | Status\n--------------------\n",
          status: "completed",
        }),
      );
    });
    // After polling succeeds, AgentJobs calls getTasks() with query params:
    //   GET /agents/{id}/tasks?limit=100&page=1&...
    // The mockAgentDetailSubResources `/tasks` glob doesn't include the query
    // so it misses; use a regex to match the path with optional query.
    await page.route(/\/api\/v2\/agents\/[^/]+\/tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse([]));
    });

    await page.goto(`/#/agents/${agent.session_id}?tab=jobs`);

    // Header renders. Use heading role — "Background Jobs" also appears in
    // the empty-state cell text, which would trip strict mode on getByText.
    await expect(
      page.getByRole("heading", { name: /Background Jobs/i }),
    ).toBeVisible();

    // Initial mount fires exactly one POST /tasks/jobs (immediate watcher on
    // agent). `.toBe(1)` catches a regression that double-fires on mount.
    // Poll timeout bumped to cover the 1s pollDelay floor + CPU contention
    // when run in parallel with the rest of the suite.
    await expect.poll(() => jobsPostCalls.length, { timeout: 10_000 }).toBe(1);

    // After polling completes the table shows the empty-state message.
    await expect(page.getByText(/No background jobs found/i)).toBeVisible({
      timeout: 10_000,
    });

    // Click Refresh: must fire exactly one additional POST, not two.
    await page.getByRole("button", { name: /^refresh$/i }).click();
    await expect.poll(() => jobsPostCalls.length, { timeout: 10_000 }).toBe(2);
  });
});
