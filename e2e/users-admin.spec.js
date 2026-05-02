// e2e/users-admin.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockUsersList } from "./helpers/api/users.js";
import { defaultUsers } from "./fixtures/users.js";

test.describe("users (admin gating)", () => {
  test("admin can see the user list", async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page, { admin: true });
    await mockEmpireBootstrap(page, { admin: true });
    await mockUsersList(page, defaultUsers);

    await page.goto("/#/users");
    for (const u of defaultUsers) {
      await expect(page.getByText(u.username)).toBeVisible();
    }
  });

  test("non-admin is blocked from /users/new", async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page, { admin: false });
    await mockEmpireBootstrap(page, { admin: false });
    await mockUsersList(page, defaultUsers);

    // Start on a permitted page so next(false) has somewhere to keep us.
    await page.goto("/#/users");
    await expect(page).toHaveURL(/#\/users$/);

    // Attempt navigation to /users/new via direct goto. The admin guard
    // calls next(false), which keeps the URL at the previous location.
    await page.goto("/#/users/new");
    // Vue Router's next(false) leaves us on /#/users (where we were).
    // Assert the exact URL so a redirect to /#/ also fails the test —
    // that would indicate a broken guard rather than the expected block.
    await expect(page).toHaveURL(/#\/users$/);
  });
});
