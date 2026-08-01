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
  // Task list poller (AgentTasksList tabs): GET /agents/*/tasks (with optional query).
  await page.route("**/api/v2/agents/*/tasks", (route) => {
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
