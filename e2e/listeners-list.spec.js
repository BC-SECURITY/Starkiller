// e2e/listeners-list.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import {
  mockListenersList,
  recordListenerActions,
} from "./helpers/api/listeners.js";
import { defaultListeners } from "./fixtures/listeners.js";

test.describe("listeners list", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Tags endpoint fires on mount from ListenersList.getTags().
    await mockTagsEndpoint(page);
    await mockListenersList(page, defaultListeners);
  });

  test("renders all listeners", async ({ page }) => {
    await page.goto("/#/listeners");
    for (const l of defaultListeners) {
      await expect(page.getByText(l.name).first()).toBeVisible();
    }
  });

  test("kill action calls DELETE for the selected listener", async ({
    page,
  }) => {
    const actions = recordListenerActions(page);
    await page.goto("/#/listeners");

    // Wait for the table to render listener names.
    await expect(page.getByText("http-1").first()).toBeVisible();

    // Open the ellipsis action menu for the first listener row.
    const row = page.getByRole("row").filter({ hasText: "http-1" });
    await row
      .locator("button")
      .filter({ has: page.locator(".fa-ellipsis-v") })
      .click();

    // Click the Delete item in the dropdown menu.
    await page
      .getByRole("listitem")
      .filter({ hasText: /delete/i })
      .click();

    // Confirm the kill dialog ("Yes" button).
    await page.getByRole("button", { name: "Yes" }).click();

    // Exactly one DELETE must fire — for the specific listener, not more.
    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].url).toMatch(/\/listeners\/1$/);
    expect(actions.calls[0].method).toBe("DELETE");
  });
});
