// e2e/helpers/api/agents.js
import { jsonResponse, paginatedResponse } from "../responses.js";
import { mockGeneralFormBackground } from "../network.js";

const AGENTS_LIST = "**/api/v2/agents*";
const AGENT_DETAIL = (id) => `**/api/v2/agents/${id}`;
// Wildcard catches /tasks, /tasks/exit, /tasks/directory_list, AND
// regressions like /agents/undefined/tasks/exit (commit 18442fe0).
const AGENT_TASKING_ANY = "**/api/v2/agents/*/tasks/**";

// Stubs the agent-detail sub-resource routes that mount automatically
// when navigating to an agent page. Composes mockGeneralFormBackground for
// the shared stubs (agents, listeners, bypasses, malleable-profiles,
// credentials) and adds the agent-detail-specific routes:
// - modules: AgentExecuteModule.vue (default "module" interact tab) fetches
//   GET /modules on mount.
// - shell POST + single-task GET: AgentShellSession.vue (Shell tab) posts
//   to /tasks/shell on mount, then polls GET /tasks/{id}. Return an
//   already-complete task so the poll exits in one iteration.
// - task list GET: the task-list poller on the Tasks tab.
// Import alongside mockAgentDetail in any spec that navigates into an agent.
export async function mockAgentDetailSubResources(page) {
  // Stubs agents, listeners, bypasses, malleable-profiles, and credentials —
  // the same set that GeneralForm.vue and AgentForm/Terminal require.
  // The agents empty-list stub is harmless; the calling spec registers its own
  // mockAgentsList afterward (LIFO wins for the spec's mock).
  await mockGeneralFormBackground(page);
  // AgentExecuteModule.vue calls moduleStore.getModules() on mount.
  await page.route("**/api/v2/modules*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/modules\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  // AgentShellSession.vue calls agentTaskApi.shell() on mount (POST /tasks/shell).
  // Return a fake task whose output is already set so pollForResult completes
  // in one iteration without sleeping.
  await page.route("**/api/v2/agents/*/tasks/shell", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill(
      jsonResponse({ id: "shell-init", output: "/", status: "completed" }, 201),
    );
  });
  // AgentShellSession.vue polls GET /agents/{id}/tasks/{taskId}.
  // Return a completed task so the poll loop exits immediately.
  await page.route("**/api/v2/agents/*/tasks/*", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Only match single-task GETs (e.g. /tasks/shell-init), not the list.
    if (!url.pathname.match(/\/tasks\/[^/]+$/)) return route.fallback();
    return route.fulfill(
      jsonResponse({ id: "shell-init", output: "/", status: "completed" }),
    );
  });
  // Task list poller (AgentTasksList tabs): GET /agents/*/tasks (with optional
  // query). getTasks() always sends query params (limit/page/order_by/...), so
  // a bare "**/api/v2/agents/*/tasks" glob — anchored with nothing after
  // "tasks" — never matches the real request and falls through to the 599
  // sentinel. Regex instead, anchored on "?" or end-of-string.
  await page.route(/\/api\/v2\/agents\/[^/]+\/tasks(\?|$)/, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

export function mockAgentsList(page, agents) {
  return page.route(AGENTS_LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Don't intercept /agents/<id> detail or sub-paths.
    if (url.pathname.match(/\/agents\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(agents));
  });
}

export function mockAgentDetail(page, agent) {
  return page.route(AGENT_DETAIL(agent.session_id), (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(agent));
  });
}

// GET /agents/{id}/files/{dir} (root load hits /files/root). getDirectory
// unwraps the `children` array; the docs shot must NOT trigger the POST
// /tasks/directory_list scrape, so return a populated children array here.
export function mockAgentDirectory(page, sessionId, children) {
  return page.route(`**/api/v2/agents/${sessionId}/files/**`, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse({ children }));
  });
}

// Endpoints only the Dashboard hits, stubbed empty:
// - GET /agents/tasks (Recent Tasks table, plus its auto-refresh poller)
// - GET /agents/checkins/ and /agents/checkins/aggregate (Check Ins chart);
//   regex because the endpoint has both a trailing-slash and a nested form,
//   which a single glob can't cover (* doesn't cross "/").
// Shared by dashboard.spec.js and login.spec.js (login redirects to the
// Dashboard, so it mounts the same fetches).
export async function mockDashboardOnlyEndpoints(page) {
  await page.route("**/api/v2/agents/tasks*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
  await page.route(/\/api\/v2\/agents\/checkins\//, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse([]));
  });
}

// GET /agents/checkins/aggregate -> { records: [{ checkin_time, count }] }.
// Register AFTER mockDashboardOnlyEndpoints: its /checkins/ regex also matches
// /checkins/aggregate, and route resolution is LIFO, so this populated payload
// wins for the aggregate call while the empty stub covers the unused path.
export function mockCheckinsAggregate(page, payload) {
  return page.route("**/api/v2/agents/checkins/aggregate*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(jsonResponse(payload));
  });
}

// GET /agents/tasks (the aggregated feed behind the Dashboard's Recent Tasks
// card). Register AFTER mockDashboardOnlyEndpoints so LIFO serves this
// populated feed instead of its empty stub.
export function mockAgentTasksFeed(page, tasks) {
  return page.route("**/api/v2/agents/tasks*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse(tasks));
  });
}

// GET /agents/{id}/tasks (the per-agent Tasks tab + Stats counts/chart source).
// Register AFTER mockAgentDetailSubResources so LIFO serves this populated list
// instead of that helper's empty stub. Matches the list route only, never
// /tasks/<id> single-task GETs. Regex (not a glob), same reasoning as the
// empty stub above: getTasks() always appends a query string.
export function mockAgentTaskList(page, tasks) {
  return page.route(/\/api\/v2\/agents\/[^/]+\/tasks(\?|$)/, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse(tasks));
  });
}

// Records URL + body for every POST to any /agents/*/tasks/* endpoint.
// Specs assert against the recorder to verify session_ids are real.
export function recordAgentTasks(page) {
  const calls = [];
  page.route(AGENT_TASKING_ANY, async (route) => {
    if (route.request().method() === "POST") {
      calls.push({
        url: route.request().url(),
        body: JSON.parse(route.request().postData() || "{}"),
      });
      return route.fulfill(jsonResponse({ id: 1, status: "queued" }, 201));
    }
    return route.fallback();
  });
  return { calls };
}
