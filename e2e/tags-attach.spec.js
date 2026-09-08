// e2e/tags-attach.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockListenersList } from "./helpers/api/listeners.js";
import {
  mockTagsRegistry,
  recordEntityTagActions,
  recordTagRegistryActions,
} from "./helpers/api/tags.js";

test.describe("attach a tag to a listener", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockTagsRegistry(page, [{ id: 1, name: "prod", color: "#ff0000" }]);
    await mockListenersList(page, [
      {
        id: "L1",
        name: "listener-1",
        enabled: true,
        template: "http",
        options: { Host: "0.0.0.0", Port: "8080" },
        created_at: "2026-01-01T00:00:00Z",
        tags: [],
      },
    ]);
  });

  test("typing a new name creates the registry tag, then attaches it by id", async ({
    page,
  }) => {
    // POST /api/v2/tags (create) is recorded here and returns id 99.
    const registry = recordTagRegistryActions(page);
    const entity = recordEntityTagActions(page, "**/api/v2/listeners/*/tags**");
    await page.goto("/#/listeners");
    // The listener has no tags, so its cell shows an "Add tags" chip; open the
    // picker, type a new name, and press Enter to create + attach it.
    await page.getByText("Add tags").first().click();
    await page.getByRole("textbox", { name: "Filter tags" }).fill("staging");
    await page.keyboard.press("Enter");

    // 1) the new name is created in the global registry...
    await expect
      .poll(() => registry.calls.filter((c) => c.method === "POST").length)
      .toBe(1);
    expect(registry.calls.find((c) => c.method === "POST").body).toEqual({
      name: "staging",
    });

    // 2) ...then attached to the listener by the new tag's id (not by name).
    await expect.poll(() => entity.attach.length).toBe(1);
    expect(entity.attach[0]).toEqual({ tag_id: 99 });
  });
});
