// e2e/agent-tasks-table.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { jsonResponse, paginatedResponse } from "./helpers/responses.js";
import {
  mockAgentsList,
  mockAgentDetail,
  mockAgentDetailSubResources,
  recordAgentTasks,
} from "./helpers/api/agents.js";
import { mockUsersList } from "./helpers/api/users.js";
import { defaultAgents } from "./fixtures/agents.js";

const agent = defaultAgents[0];
const AGENT = agent.session_id;

// A task row with every field the AgentTasksTable template reads.
function taskRow(overrides = {}) {
  return {
    id: 7,
    agent_id: AGENT,
    status: "completed",
    task_name: "TASK_SHELL",
    module_name: null,
    input: "whoami",
    full_input: "whoami",
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    tags: [],
    downloads: [],
    ...overrides,
  };
}

test.describe("agent tasks table", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockAgentDetailSubResources(page);
    await mockAgentsList(page, defaultAgents);
    await mockAgentDetail(page, agent);
    // AgentTasksList.mounted() also fires getUsers() (populates the Users
    // filter, which is what actually seeds selectedUsers so the table's own
    // getTasks() doesn't short-circuit on "no filters selected") and
    // getTags({sources: "agent_task"}). Neither is covered by
    // mockAgentDetailSubResources, so without these they hit the
    // blockUnmockedApi 599 fallback and trip the consoleGuard.
    await mockUsersList(page, []);
    await mockTagsEndpoint(page);
  });

  // Mocks the task-list GET (with query) to return exactly `rows`, and the
  // single-task GET to return `fullTask`. Registered inside each test so the
  // list-with-query route (regex) takes LIFO precedence over the empty-list
  // stub from mockAgentDetailSubResources.
  async function mockTasks(page, rows, fullTask) {
    // AgentTasksTable calls agentTaskApi.getTasks(selectedAgents, ...), and
    // selectedAgents is an array here (AgentTasksList seeds it with
    // [agent.session_id]). getTasks() special-cases an array sessionId: it
    // hits the plural /agents/tasks endpoint with an `agents=` query param,
    // NOT /agents/{id}/tasks. The optional `([^/]+\/)?` group also matches
    // the singular shape so this stays robust if that ever changes.
    await page.route(/\/api\/v2\/agents\/([^/]+\/)?tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse(rows));
    });
    await page.route(/\/api\/v2\/agents\/[^/]+\/tasks\/\d+$/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(jsonResponse(fullTask));
    });
  }

  async function openRowMenu(page) {
    // AgentEdit's own top toolbar (Teleported into the app bar) also renders
    // an fa-ellipsis-v button ("Clear Queued Tasks" / "Kill Agent" / ...), so
    // an unscoped locator resolves to that one first (it's earlier in the
    // DOM). Scope to the data table wrapper to land on the row's own button.
    await page
      .locator(".v-data-table")
      .locator("button:has(.fa-ellipsis-v)")
      .first()
      .click();
  }

  test("rerun of a module task calls executeModule", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await mockTasks(
      page,
      [taskRow({ module_name: "mimikatz", task_name: null })],
      {
        id: 7,
        agent_id: AGENT,
        module_name: "mimikatz",
        options: { Foo: "bar" },
      },
    );
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Rerun Task").click();
    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/module/")).length,
      )
      .toBe(1);
  });

  test("rerun of a shell task calls shell", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await mockTasks(page, [taskRow({ task_name: "TASK_SHELL" })], {
      id: 7,
      agent_id: AGENT,
      task_name: "TASK_SHELL",
      full_input: "whoami",
    });
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Rerun Task").click();
    await expect
      .poll(
        () => tasks.calls.filter((c) => c.url.endsWith("/tasks/shell")).length,
      )
      // Use >= to tolerate the auto-mounted AgentShellSession tab also POSTing to /tasks/shell
      .toBeGreaterThanOrEqual(1);
  });

  test("rerun of a sysinfo task calls sysinfo", async ({ page }) => {
    const tasks = recordAgentTasks(page);
    await mockTasks(page, [taskRow({ task_name: "TASK_SYSINFO" })], {
      id: 7,
      agent_id: AGENT,
      task_name: "TASK_SYSINFO",
    });
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Rerun Task").click();
    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/sysinfo")).length,
      )
      .toBe(1);
  });

  test("unsupported task hides the Rerun action", async ({ page }) => {
    await mockTasks(
      page,
      [taskRow({ task_name: "TASK_DOWNLOAD", module_name: null })],
      {},
    );
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    // v-show hides the item; Stop Task is still present so the menu is open.
    await expect(page.getByText("Stop Task")).toBeVisible();
    await expect(page.getByText("Rerun Task")).toBeHidden();
  });

  test("a getTask failure surfaces the 'Error rerunning task' snack", async ({
    page,
  }) => {
    // App.vue's `empireVersion` watcher (immediate: true) fires straight off
    // the persisted store value on mount and, for a version <5.2, queues a
    // "recommended to be used with Empire 5.2" warning into the same
    // single-slot snack queue this test's "Error rerunning task" snack lands
    // in. Left unpatched (setFakeAuth's default "0.0.0-test"), the warning
    // shows first and the error snack has to wait for it to auto-dismiss
    // (v-snackbar default 5000ms timeout) plus the queue's 500ms
    // advance-delay before it mounts -- close enough to Playwright's 5000ms
    // assert timeout to be a real flakiness risk under CI load.
    // (This is NOT fetched via /api/v2/meta/version -- that endpoint is only
    // ever called from application-module.js's login(), which setFakeAuth-
    // based specs never invoke; a route override for it here would be dead.)
    // Patch the persisted value directly so no warning is ever queued and
    // the error snack can render immediately.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.empireVersion = "5.2.0";
      localStorage.setItem("application", JSON.stringify(state));
    });
    recordAgentTasks(page);
    // List returns a module row (Rerun visible); the single-task GET fails.
    await page.route(/\/api\/v2\/agents\/([^/]+\/)?tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(
        paginatedResponse([
          taskRow({ module_name: "mimikatz", task_name: null }),
        ]),
      );
    });
    await page.route(/\/api\/v2\/agents\/[^/]+\/tasks\/\d+$/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      // A non-2xx status here would make Chromium log a browser-level
      // "Failed to load resource: ... status of 5xx" console error, which
      // isn't in fixtures/test.js's allowlist (only 401/token and
      // net::ERR_FAILED are) and would trip the consoleGuard. Fulfilling
      // 200 with an unparseable body drives the exact same failure path in
      // the app instead: http.js's safeParse() throws a synthetic error
      // (`err.response = { status: 200, ... }`) that getTask() still
      // rejects with, so rerunTask()'s catch still fires — without a
      // non-2xx network-level status.
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "not valid json",
      });
    });
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Rerun Task").click();
    await expect(page.getByText(/Error rerunning task/i)).toBeVisible();
  });

  test("a getTask failure on Copy to Clipboard (Input) surfaces an error snack", async ({
    page,
  }) => {
    // Same empireVersion patch as the "Error rerunning task" test above --
    // avoids a competing warning snack racing this one in the same
    // single-slot queue.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.empireVersion = "5.2.0";
      localStorage.setItem("application", JSON.stringify(state));
    });
    // Default taskRow() has input but no output, so only the Input
    // "Copy to Clipboard" menu item renders -- getByText stays unique
    // without scoping to a section. The row is never expanded here, so
    // TasksTable's copyInput() (not handleItemExpanded()) is what calls
    // adapter.getTask() and must be the one to catch the failure.
    await page.route(/\/api\/v2\/agents\/([^/]+\/)?tasks(\?|$)/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(paginatedResponse([taskRow()]));
    });
    await page.route(/\/api\/v2\/agents\/[^/]+\/tasks\/\d+$/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      // Unparseable 200 body, mirroring the getTask-failure test above --
      // drives the same rejection path without tripping the consoleGuard.
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "not valid json",
      });
    });
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Copy to Clipboard").click();
    await expect(
      page.getByText(/Error loading task 7 for copy/i),
    ).toBeVisible();
  });

  test("hideColumns keeps a column hidden from the header menu", async ({
    page,
  }) => {
    // AgentTasksList always passes :hide-columns="['id']" to TasksTable.
    // Hidden columns are now filtered out from the column picker entirely,
    // so they don't appear as selectable options.
    await mockTasks(page, [taskRow()], {});
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await page.locator("button:has(.mdi-format-columns)").click();
    // Verify that Task ID is not in the menu at all
    await expect(page.getByRole("checkbox", { name: "Task ID" })).toHaveCount(
      0,
    );
  });

  test("hideColumns keeps a column hidden from the rendered table even when the persisted header store selects it", async ({
    page,
  }) => {
    // The header menu ("column picker") no longer offers Task ID as a
    // selectable option (see the test above), but that alone doesn't prove
    // the *rendered table* can't show it -- e.g. if a stale/imported
    // localStorage value already includes it. TasksTable's `headers`
    // computed applies the same hideColumns filter independently of (and on
    // top of) the persisted taskHeaders store, which is the actual
    // load-bearing guarantee. Force the store to include Task ID (plus a
    // few defaults so the table still renders normally) and confirm the
    // table still hides it -- id is `defaultHeader: false`, so without this
    // seeding "Task ID absent" would be vacuously true regardless of the
    // hideColumns filter.
    await page.addInitScript(() => {
      const state = JSON.parse(localStorage.getItem("application"));
      state.taskHeaders = [
        { title: "Task ID", key: "id" },
        { title: "Status", key: "status" },
        { title: "Task Name", key: "task_name" },
        { title: "Agent", key: "agent_id" },
      ];
      localStorage.setItem("application", JSON.stringify(state));
    });
    await mockTasks(page, [taskRow()], {});
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    // Non-vacuity check FIRST: wait for a different seeded column that
    // ISN'T hidden to actually render, proving the store-seeding took
    // effect and the table has finished mounting its headers. (Asserting
    // the Task ID absence below before the table has rendered anything
    // would trivially pass on an empty/unmounted table, regardless of
    // whether hideColumns actually filtered it out.)
    await expect(
      page.locator(".v-data-table th", { hasText: "Status" }),
    ).toHaveCount(1);
    // Now that the table has rendered with the seeded headers, confirm
    // hideColumns=['id'] (set by AgentTasksList) still won over the seeded
    // store entry for Task ID.
    await expect(
      page.locator(".v-data-table th", { hasText: "Task ID" }),
    ).toHaveCount(0);
  });

  test("stop task asks for confirmation before calling stop_job", async ({
    page,
  }) => {
    const tasks = recordAgentTasks(page);
    await mockTasks(page, [taskRow()], {});
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Stop Task").click();
    await page.getByRole("button", { name: "Yes" }).click();
    await expect
      .poll(
        () =>
          tasks.calls.filter((c) => c.url.endsWith("/tasks/stop_job")).length,
      )
      .toBe(1);
  });

  test("stop task does not call stop_job if the confirmation is declined", async ({
    page,
  }) => {
    const tasks = recordAgentTasks(page);
    await mockTasks(page, [taskRow()], {});
    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await openRowMenu(page);
    await page.getByText("Stop Task").click();
    await page.getByRole("button", { name: "Cancel" }).click();
    // Give any (incorrect) fire-and-forget call a chance to land before
    // asserting it never did.
    await page.waitForTimeout(200);
    expect(
      tasks.calls.filter((c) => c.url.endsWith("/tasks/stop_job")).length,
    ).toBe(0);
  });

  test("View Images renders the image at the correct download id when the row and detail download orders differ", async ({
    page,
  }) => {
    // downloadApi.getDownloadAsUrl() always calls the real
    // window.URL.createObjectURL(blob) -- a genuine blob: URL whose content
    // isn't practically assertable, and (if it were left unmocked) an
    // invalid/empty blob may fail to decode as an image, which could trigger
    // a console error the consoleGuard fixture doesn't allowlist. Stub
    // createObjectURL to return a fixed, always-loadable 1x1 PNG data: URL
    // instead, so the assertion below can check for an exact, recognizable
    // src and the <v-img> genuinely finishes loading (no console errors).
    const MOCK_IMAGE_URL =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    await page.addInitScript((url) => {
      window.URL.createObjectURL = () => url;
    }, MOCK_IMAGE_URL);

    // getImagesForTask() stores fetched image URLs onto
    // expandedTasks[uniqueId].downloads (the single-task GET's "detail"
    // list) -- imageData() reads them back from that same list, by id. The
    // old code iterated the ROW's downloads but wrote each URL into the
    // DETAIL list at that same loop index -- correct only when the row and
    // detail arrays share order and length. (The old code's "already
    // fetched" guard was separately broken -- it used download.id as a raw
    // array index rather than an id lookup -- but with realistic ids that's
    // almost always a false negative, causing redundant re-fetches rather
    // than wrong images; this test targets the write regression, not the
    // guard.) Force a row/detail mismatch here so a regression to the old
    // index-based write is caught: the row has a single image download at
    // index 0, while the detail response has a non-image at index 0 and the
    // same image at index 1.
    const rowDownloads = [{ id: 99, filename: "shot.png" }];
    const detailDownloads = [
      { id: 50, filename: "notes.txt" },
      { id: 99, filename: "shot.png" },
    ];
    await mockTasks(
      page,
      [taskRow({ downloads: rowDownloads, output: "some output" })],
      { id: 7, agent_id: AGENT, downloads: detailDownloads },
    );
    // Body content is irrelevant -- createObjectURL is stubbed above, so
    // the blob it would normally wrap is never actually used.
    await page.route(/\/api\/v2\/downloads\/99\/download$/, (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from("fake-image-bytes"),
      });
    });

    await page.goto(`/#/agents/${AGENT}?tab=tasks`);
    await page
      .locator(".v-data-table tbody tr")
      .first()
      .locator("button:has(.fa-chevron-down)")
      .click();

    // Non-vacuity: the v-img wrapper for the row's image download renders
    // as soon as the row expands -- it's driven by the row's own
    // downloads, not the async detail fetch getImagesForTask() triggers --
    // so this confirms the image area actually mounted before the src
    // assertion below, rather than trivially passing/failing against an
    // unmounted tree.
    await expect(
      page.locator('[role="img"][aria-label="shot.png"]'),
    ).toHaveCount(1);

    await page.getByText("View Images").click();

    await expect(page.locator('img[alt="shot.png"]')).toHaveAttribute(
      "src",
      MOCK_IMAGE_URL,
    );
  });
});
