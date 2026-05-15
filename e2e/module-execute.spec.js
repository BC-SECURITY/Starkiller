// e2e/module-execute.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import { mockAgentsList } from "./helpers/api/agents.js";
import {
  mockModulesList,
  mockModuleDetail,
  recordModuleExecutions,
} from "./helpers/api/modules.js";
import { defaultAgents } from "./fixtures/agents.js";
import { defaultModules } from "./fixtures/modules.js";

test.describe("module execute", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // GeneralForm.vue fetches agents, listeners, bypasses, malleable-profiles,
    // and credentials on mount. Must be stubbed before the form renders.
    await mockGeneralFormBackground(page);
    await mockAgentsList(page, defaultAgents);
    // AgentExecuteModule calls moduleStore.getModules() (GET /modules) on
    // mount, then filters by el.enabled. mockModulesList covers the list;
    // mockModuleDetail covers the per-module GET used by module detail pages.
    await mockModulesList(page, defaultModules);
    await mockModuleDetail(page, defaultModules[0]);
  });

  test("submits a task to the selected agent", async ({ page }) => {
    const execs = recordModuleExecutions(page);
    await page.goto(`/#/modules/${defaultModules[0].id}`);

    // ModuleExecute.vue renders a v-autocomplete with placeholder="Agents"
    // (no label). Click it to open the dropdown.
    await page.getByPlaceholder("Agents").click();
    await page
      .getByRole("option", { name: defaultAgents[0].session_id })
      .click();

    // Close the dropdown by pressing Escape so it doesn't obscure other UI.
    await page.keyboard.press("Escape");

    // AgentExecuteModule loads the module list on mount (initialLoad = true)
    // and then auto-selects the module from the route param. Wait for the
    // Submit button to appear (rendered only when selectedModule is set).
    await expect(
      page.getByRole("button", { name: /submit/i }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Submit via the inner Submit button inside AgentExecuteModule.
    // (EditPageTop also has a Submit button but it delegates to the same
    // create() method via $refs.executeform.create().)
    await page
      .getByRole("button", { name: /submit/i })
      .first()
      .click();

    await expect.poll(() => execs.calls.length).toBe(1);
    // The URL must contain the exact agent session_id selected — not "undefined",
    // "null", or "[object Object]".
    const agentIdInUrl = execs.calls[0].url.match(
      /\/agents\/([^/]+)\/tasks\/module/,
    )?.[1];
    expect(agentIdInUrl).toBe(defaultAgents[0].session_id);
    expect(execs.calls[0].url).not.toContain("undefined");
    expect(execs.calls[0].url).not.toContain("null");
    expect(execs.calls[0].url).not.toContain("[object");
    expect(execs.calls[0].body.module_id).toBe(defaultModules[0].id);
  });
});
