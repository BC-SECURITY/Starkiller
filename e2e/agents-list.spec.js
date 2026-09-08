// e2e/agents-list.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { navigateInApp } from "./helpers/navigation.js";
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

  test("deselecting every column and saving reseeds defaults on the next mount", async ({
    page,
  }) => {
    // Same persisted-header model as the task tables (see
    // plugin-tasks-table.spec.js): alwaysShow columns are never persisted,
    // so a deselect-all save writes an empty agentHeaders store, which
    // mounted() reseeds to defaults on remount. Before this model, the
    // save persisted the four titled alwaysShow entries, the reseed guard
    // never fired, and the table was stuck at four columns permanently.
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(1);

    await page.locator("button:has(.mdi-format-columns)").click();
    const menu = page.locator(".v-overlay__content");
    // Two clicks: check "Select All" (every selectable column), then
    // uncheck it (none), and save the empty selection.
    await menu.getByLabel("Select All", { exact: true }).click();
    await menu.getByLabel("Select All", { exact: true }).click();
    await menu.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(0);
    // alwaysShow columns keep rendering via the headers short-circuit.
    await expect(
      page.locator(".v-data-table th", { hasText: "Name" }).first(),
    ).toBeVisible();

    // Remount via Settings, which mounts with this spec's mocks and has
    // no data table — positive proof the agents table unmounted.
    await navigateInApp(page, "#/settings");
    await expect(page.locator(".v-data-table")).toHaveCount(0);
    await navigateInApp(page, "#/agents");
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(1);
  });

  test("a legacy-shaped agentHeaders store with no titled entries reseeds to defaults", async ({
    page,
  }) => {
    // Pre-4.0 stores persisted {text, value} header objects. None of
    // those entries has a title, so mounted()'s reseed guard must fire —
    // otherwise nothing would match the current header shape and the
    // table would render only its alwaysShow columns.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.agentHeaders = [{ text: "Delay", value: "delay" }];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");
    // Non-vacuity: the reseeded defaults must render (Hostname is a
    // default) while the legacy pick for the non-default Delay column is
    // discarded rather than honored.
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Delay" }),
    ).toHaveCount(0);
  });

  test("a store contaminated by a pre-fix deselect-all reseeds to defaults", async ({
    page,
  }) => {
    // Migration: a deselect-all save under the previous build persisted
    // exactly the four titled alwaysShow entries, which pass the
    // `some(h => h.title)` reseed guard. Without mounted() stripping
    // alwaysShow entries first, an already-affected install would stay
    // stuck at four columns forever.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.agentHeaders = [
        { title: "Name", key: "name", alwaysShow: true, order: 1 },
        {
          title: "Last Seen",
          key: "lastseen_time",
          alwaysShow: true,
          order: 2,
        },
        {
          title: "First Seen",
          key: "checkin_time",
          alwaysShow: true,
          order: 3,
        },
        { title: "Actions", key: "actions", alwaysShow: true, order: 18 },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Delay" }),
    ).toHaveCount(0);
  });

  test("cleaning a contaminated store preserves the user's real picks", async ({
    page,
  }) => {
    // Migration: alwaysShow entries persisted by older builds are
    // stripped, but a store that still holds a titled real pick must NOT
    // be reseeded — the user's selection survives the cleanup. Delay has
    // no defaultHeader, so it fully discriminates preserve from reseed:
    // reseeding would drop Delay and bring back the default Hostname.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.agentHeaders = [
        { title: "Name", key: "name", alwaysShow: true, order: 1 },
        { title: "Delay", key: "delay", order: 15 },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await mockAgentsList(page, defaultAgents);
    await page.goto("/#/agents");
    await expect(
      page.locator(".v-data-table th", { hasText: "Delay" }),
    ).toHaveCount(1);
    await expect(
      page.locator(".v-data-table th", { hasText: "Hostname" }),
    ).toHaveCount(0);
  });
});
