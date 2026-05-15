// e2e/bypasses.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import {
  mockBypassesList,
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
});
