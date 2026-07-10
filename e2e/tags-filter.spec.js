// e2e/tags-filter.spec.js
//
// Verifies that the flat-name tag filter in AgentsList correctly shows only
// agents whose tags match the selected name. The client-side filter in
// AgentsTable.vue compares agent.tags[].name against selectedTags (strings).
// This spec seeds two agents with distinct tag names and asserts that checking
// one tag name hides the other agent.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockAgentsList } from "./helpers/api/agents.js";
import { paginatedResponse } from "./helpers/responses.js";

// Two agents, each carrying a distinct flat tag name.
const agentRed = {
  session_id: "RED00001",
  name: "RED00001",
  hostname: "DESKTOP-RED",
  username: "user1",
  high_integrity: false,
  process_name: "powershell.exe",
  language: "powershell",
  archived: false,
  stale: false,
  checkin_time: "2026-04-30T10:00:00Z",
  tags: [{ id: 1, name: "red-team" }],
};

const agentBlue = {
  session_id: "BLU00002",
  name: "BLU00002",
  hostname: "DESKTOP-BLUE",
  username: "user2",
  high_integrity: false,
  process_name: "powershell.exe",
  language: "powershell",
  archived: false,
  stale: false,
  checkin_time: "2026-04-30T11:00:00Z",
  tags: [{ id: 2, name: "blue-team" }],
};

const tagFixtures = [
  { id: 1, name: "red-team" },
  { id: 2, name: "blue-team" },
];

test.describe("tag name filter — agents list", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Override the tags endpoint to return flat-name tags (no value field).
    await page.route("**/api/v2/tags*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse(tagFixtures));
    });
  });

  test("selecting a tag name filters agents to only matching rows", async ({
    page,
  }) => {
    await mockAgentsList(page, [agentRed, agentBlue]);
    await page.goto("/#/agents");

    // Both agents should be visible before any filter is applied.
    await expect(page.getByText(agentRed.name).first()).toBeVisible();
    await expect(page.getByText(agentBlue.name).first()).toBeVisible();

    // Open the Tags expansion panel (scoped to the filter button, not the nav item).
    await page.getByRole("button", { name: "Tags" }).click();

    // Check the "red-team" checkbox — the label comes from tag.name since
    // label="name" is now set on the ExpansionPanelFilter.
    await page.getByLabel("red-team").check();

    // Only the red-team agent should remain visible.
    await expect(page.getByText(agentRed.name).first()).toBeVisible();
    await expect(page.getByText(agentBlue.name)).toHaveCount(0);
  });
});
