// e2e/agents-list.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  recordAgentTasks,
} from "./helpers/api/agents.js";
import { defaultAgents } from "./fixtures/agents.js";

test.describe("agents list", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Tags endpoint fires on mount from AgentsList.getTags().
    await mockTagsEndpoint(page);
  });

  test("renders all agents from the fixture", async ({ page }) => {
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");
    // The table renders the agent's name column (not session_id).
    // For most agents name === session_id; one fixture has a distinct name.
    for (const agent of defaultAgents) {
      await expect(page.getByText(agent.name).first()).toBeVisible();
    }
  });

  test("mass kill posts exit task for each selected agent (regression: 18442fe0)", async ({
    page,
  }) => {
    await mockAgentsList(page, defaultAgents);
    const tasks = recordAgentTasks(page);
    await page.goto("/#/agents");

    // Wait for agents to render so the table and checkboxes are mounted.
    await expect(
      page.getByText(defaultAgents[0].session_id).first(),
    ).toBeVisible();

    // Select all rows. v-data-table's "select all" checkbox is in thead.
    await page.locator("thead input[type='checkbox']").first().check();

    // The Kill button is rendered by ListPageTop with deleteText="Kill".
    await page.getByRole("button", { name: /kill/i }).click();

    // Confirm.vue renders a "Yes" button in the v-dialog.
    await page.getByRole("button", { name: "Yes" }).click();

    // Allow the forEach to flush.
    await expect.poll(() => tasks.calls.length).toBe(defaultAgents.length);

    // Regression assertion: the exact set of session_ids posted must match
    // the fixture — rejects "undefined", "null", "[object Object]", etc.
    const got = new Set(
      tasks.calls.map(
        (c) => c.url.match(/\/agents\/([^/]+)\/tasks\/exit$/)?.[1],
      ),
    );
    const expected = new Set(defaultAgents.map((a) => a.session_id));
    expect(got).toEqual(expected);
    // Belt-and-suspenders: also assert no URL contains stringified bad values.
    for (const call of tasks.calls) {
      expect(call.url).not.toContain("undefined");
      expect(call.url).not.toContain("null");
      expect(call.url).not.toContain("[object");
    }
  });

  test("clicking an agent name navigates to its detail page", async ({
    page,
  }) => {
    await mockAgentDetail(page, defaultAgents[0]);
    // Sub-resource mocks for the agent detail page that loads after navigation.
    // Must be registered before mockAgentsList so that mockAgentsList (LIFO) wins
    // for the agents-list GET and overrides the empty-agents stub in
    // mockGeneralFormBackground (composed inside mockAgentDetailSubResources).
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");

    // Confirm the table rendered before clicking; if this fails the table
    // never mounted and a row click would silently hit the wrong element.
    await expect(page.getByText(defaultAgents[0].name).first()).toBeVisible();

    // The name cell is a router-link to agentEdit. Click it and assert
    // the URL contains the agent's session_id.
    await page
      .getByRole("row")
      .filter({ hasText: defaultAgents[0].name })
      .getByText(defaultAgents[0].name)
      .click();
    await expect(page).toHaveURL(
      new RegExp(`#/agents/${defaultAgents[0].session_id}$`),
    );
  });
});
