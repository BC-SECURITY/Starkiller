// e2e/bypasses.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockBypassesList,
  mockBypassDetail,
  recordBypassActions,
} from "./helpers/api/bypasses.js";
import { defaultBypasses } from "./fixtures/bypasses.js";
import { jsonResponse } from "./helpers/responses.js";

test.describe("bypasses", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    await mockBypassesList(page, defaultBypasses);
  });

  test("renders bypasses list", async ({ page }) => {
    await page.goto("/#/bypasses");
    await expect(page.getByText("amsi-bypass-1")).toBeVisible();
  });

  test("create bypass posts payload", async ({ page }) => {
    const actions = recordBypassActions(page);
    // After a successful create, BypassEdit navigates to bypassEdit (id=99)
    // which calls getBypass(99). Stub it so the redirect doesn't produce
    // unmocked-API errors.
    await page.route("**/api/v2/bypasses/*", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill(
        jsonResponse({
          id: 99,
          name: "new-bypass",
          language: "powershell",
          code: "",
        }),
      );
    });
    await page.goto("/#/bypasses/new");

    await page.getByLabel(/^name$/i).fill("new-bypass");

    // Language field — required by BypassEdit.vue v-text-field rules.
    await expect(page.getByLabel(/^language$/i)).toBeVisible();
    await page.getByLabel(/^language$/i).fill("powershell");

    // Code field — required by BypassEdit.vue v-textarea rules.
    await expect(page.getByLabel(/^code$/i)).toBeVisible();
    await page.getByLabel(/^code$/i).fill("Write-Output 'test'");

    await page
      .getByRole("button", { name: /save|create|submit/i })
      .first()
      .click();
    // Exactly one POST must fire — no duplicate submissions.
    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].body.name).toBe("new-bypass");
    expect(actions.calls[0].body.language).toBe("powershell");
    expect(actions.calls[0].body.code).toBe("Write-Output 'test'");
  });

  // Regression test: deleteBypass() used to fire the delete without await
  // and navigate away unconditionally, so a rejected delete produced zero
  // UI-visible signal and the operator was already on the list page before
  // the delete could possibly have failed.
  test("delete surfaces an error and stays on the page when the delete fails", async ({
    page,
  }) => {
    await mockBypassDetail(page, defaultBypasses[0]);
    await page.route(`**/api/v2/bypasses/${defaultBypasses[0].id}`, (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "boom" }),
      });
    });

    await page.goto(`/#/bypasses/${defaultBypasses[0].id}`);
    await expect(page.getByLabel(/^name$/i)).toHaveValue(
      defaultBypasses[0].name,
    );
    // Dismiss the "recommended Empire version" compat banner — it's queued
    // through the same snackbar as our error toast, and would otherwise
    // delay it past the assertion timeout below.
    await page.locator("button:has(.fa-times)").click();

    await page.locator("button:has(.fa-trash-alt)").click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect(page.getByText(/error/i)).toBeVisible();
    // Still on the edit page — did not navigate to the bypasses list.
    await expect(page).toHaveURL(
      new RegExp(`#/bypasses/${defaultBypasses[0].id}$`),
    );
  });

  test("delete navigates to the list on success", async ({ page }) => {
    await mockBypassDetail(page, defaultBypasses[0]);
    const actions = recordBypassActions(page);

    await page.goto(`/#/bypasses/${defaultBypasses[0].id}`);
    await expect(page.getByLabel(/^name$/i)).toHaveValue(
      defaultBypasses[0].name,
    );

    await page.locator("button:has(.fa-trash-alt)").click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect.poll(() => actions.calls.length).toBe(1);
    expect(actions.calls[0].method).toBe("DELETE");
    await expect(page).toHaveURL(/#\/bypasses$/);
  });

  test("bulk delete calls DELETE for each selected bypass (regression: bulk delete was a silent no-op)", async ({
    page,
  }) => {
    const actions = recordBypassActions(page);
    await page.goto("/#/bypasses");

    await expect(page.getByText(defaultBypasses[0].name).first()).toBeVisible();

    // Select all rows. v-data-table's "select all" checkbox is in thead.
    await page.locator("thead input[type='checkbox']").first().check();

    await page.getByRole("button", { name: /delete/i }).click();
    await page.getByRole("button", { name: "Yes" }).click();

    await expect.poll(() => actions.calls.length).toBe(defaultBypasses.length);

    // Regression assertion: each DELETE must target the bypass's real id, not
    // "undefined" (item-value was "name", but the handler dereferenced .id
    // off the resulting primitive).
    const got = new Set(
      actions.calls.map((c) => c.url.match(/\/bypasses\/([^/]+)$/)?.[1]),
    );
    const expected = new Set(defaultBypasses.map((b) => String(b.id)));
    expect(got).toEqual(expected);
  });
});
