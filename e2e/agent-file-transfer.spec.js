// e2e/agent-file-transfer.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  recordAgentTasks,
} from "./helpers/api/agents.js";
import { mockDownloadsList } from "./helpers/api/downloads.js";
import { defaultAgents } from "./fixtures/agents.js";
import { defaultDownloads } from "./fixtures/downloads.js";

test.describe("agent file transfer", () => {
  const agent = defaultAgents[0];

  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, agent);
    // FileInput.vue (used by AgentUploadDialog) calls getDownloads() on mount.
    await mockDownloadsList(page, defaultDownloads);
  });

  async function openAgentMenu(page) {
    // The upload/download actions live behind the ellipsis-v menu in the agent
    // toolbar (Teleported into #app-bar). Target the button by its FA icon
    // rather than position — the app bar also holds chat + notification icons.
    await page.locator("button:has(.fa-ellipsis-v)").click();
  }

  test("download dialog POSTs to /tasks/download with path", async ({
    page,
  }) => {
    const tasks = recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);

    await openAgentMenu(page);
    await page
      .locator(".v-list-item")
      .filter({ hasText: /^Download$/ })
      .click();

    // Dialog renders with a single text field for the agent-side path.
    const pathField = page.getByLabel(/path\/to\/file/i).first();
    await pathField.fill("C:\\Users\\target\\secrets.txt");

    await page.getByRole("button", { name: /^save$/i }).click();

    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/download")).length,
      )
      .toBe(1);
    const call = tasks.calls.find((c) => c.url.endsWith("/tasks/download"));
    expect(call.body.path_to_file).toBe("C:\\Users\\target\\secrets.txt");
  });

  test("upload dialog POSTs to /tasks/upload with file_id and path", async ({
    page,
  }) => {
    const tasks = recordAgentTasks(page);
    await page.goto(`/#/agents/${agent.session_id}`);

    await openAgentMenu(page);
    await page
      .locator(".v-list-item")
      .filter({ hasText: /^Upload$/ })
      .click();

    // Pick a server file from the autocomplete (FileInput).
    // The "Server Files" name is shared by the prepend and clear icons in the
    // v-autocomplete; target the combobox role to disambiguate.
    const fileSelect = page.getByRole("combobox", { name: /server files/i });
    await fileSelect.click();
    await page
      .getByRole("option", { name: new RegExp(defaultDownloads[0].location) })
      .first()
      .click();

    // The `fileName` watcher in AgentUploadDialog auto-fills internalPathToFile
    // (C:\tmp\<name> for powershell/csharp/c, /tmp/<name> for python/ironpython).
    // We override with our own value and assert it round-trips to the POST body.
    // The "On the agent's machine" suffix uniquely identifies the upload
    // dialog's path field — the download dialog also has a "path/to/file" label.
    const pathField = page.getByLabel(/On the agent's machine/i);
    await pathField.fill("C:\\tmp\\report.txt");

    await page.getByRole("button", { name: /^upload$/i }).click();

    await expect
      .poll(
        () => tasks.calls.filter((c) => c.url.endsWith("/tasks/upload")).length,
      )
      .toBe(1);
    const call = tasks.calls.find((c) => c.url.endsWith("/tasks/upload"));
    expect(call.body.file_id).toBe(defaultDownloads[0].id);
    expect(call.body.path_to_file).toBe("C:\\tmp\\report.txt");
  });
});
