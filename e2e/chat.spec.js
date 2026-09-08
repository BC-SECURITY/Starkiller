// e2e/chat.spec.js
//
// The only spec that renders anything behind <socket-notifications>. Two
// things have to line up for chat to mount at all, and both are easy to get
// wrong:
//
//  1. App.vue gates the component behind versionSatisfies(">=4.0"), so
//     setFakeAuth's default "0.0.0-test" keeps it unmounted. This spec passes
//     a real empireVersion to opt in.
//  2. blockSockets aborts the Socket.IO *requests*, but io() still returns a
//     Socket object and SocketNotifications renders chat on
//     v-if="socket && chatWidget" — object truthiness, not connectivity. So
//     the UI mounts and works offline; only inbound events are missing.
//
// Everything here is therefore driven through the composer, which appends the
// message locally as author "me" without waiting for a server echo.
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import { blockSockets, mockEmpireBootstrap } from "./helpers/network.js";
import { mockUsersList } from "./helpers/api/users.js";
import { defaultUsers } from "./fixtures/users.js";

const WIDE_TABLE = [
  "| Hostname | Internal IP | Username | Process | Last Seen |",
  "| --- | --- | --- | --- | --- |",
  "| WIN-DC01.corp.local | 10.10.14.203 | CORP\\administrator | powershell.exe (4820) | 2026-07-31 21:14:02 |",
].join("\n");

async function openChat(page) {
  await page.goto("/#/notifications");
  await page
    .getByRole("button")
    .filter({ has: page.locator(".mdi-chat") })
    .click();
  // toBeVisible() is NOT enough here: a closed v-navigation-drawer is still in
  // the DOM at full size, just translated past the right edge of the viewport,
  // which Playwright counts as visible. Assert it is actually on screen —
  // otherwise every test below would happily drive a closed drawer and only
  // fail later, intermittently, somewhere else.
  await expect
    .poll(async () => {
      const box = await page.locator(".chat-drawer").boundingBox();
      const { width } = page.viewportSize();
      return box !== null && box.x + box.width <= width + 1;
    })
    .toBe(true);
}

function composer(page) {
  return page.getByPlaceholder("Message...");
}

test.describe("chat", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page, { empireVersion: "6.0.0" });
    await mockEmpireBootstrap(page);
    // Chat calls userStore.getUsers() on mount to resolve avatars.
    await mockUsersList(page, defaultUsers);
  });

  // Regression test for the open-before-mounted race. The app bar's chat
  // button appears as soon as `chatWidget` is true, but <chat> lives behind
  // <socket-notifications> (gated on empireVersion and the socket) and is
  // loaded via defineAsyncComponent on top of that. A click landing in that
  // window used to hit an undefined $refs chain and vanish, which is why the
  // flag now lives in the application store instead of in a component.
  test("opens even when the chat chunk is still loading", async ({ page }) => {
    // Hold the chat chunk back so the click provably lands first.
    let releaseChunk;
    const chunkHeld = new Promise((resolve) => {
      releaseChunk = resolve;
    });
    // Dev server serves the dynamic import as /src/components/Chat.vue; a
    // production build would name it Chat-<hash>.js. Match either.
    await page.route(/Chat\.vue|\/Chat-[^/]*\.js/, async (route) => {
      await chunkHeld;
      await route.continue();
    });

    await page.goto("/#/notifications");
    await page
      .getByRole("button")
      .filter({ has: page.locator(".mdi-chat") })
      .click();
    // Nothing is rendered yet — the component itself has not arrived.
    await expect(page.locator(".chat-drawer")).toHaveCount(0);

    releaseChunk();

    await expect(page.getByPlaceholder("Message...")).toBeVisible();
    await expect
      .poll(async () => {
        const box = await page.locator(".chat-drawer").boundingBox();
        const { width } = page.viewportSize();
        return box !== null && box.x + box.width <= width + 1;
      })
      .toBe(true);
  });

  test("Enter sends the message", async ({ page }) => {
    await openChat(page);
    await composer(page).fill("hello operators");
    await composer(page).press("Enter");

    await expect(page.locator(".chat-msg--me")).toHaveText("hello operators");
    await expect(composer(page)).toHaveValue("");
  });

  test("Shift+Enter inserts a newline instead of sending", async ({ page }) => {
    await openChat(page);
    await composer(page).fill("first");
    await composer(page).press("Shift+Enter");
    // The textarea is a controlled input (:model-value + @update:model-value),
    // so let the newline round-trip through the parent before typing again —
    // synthetic keystrokes can otherwise outrun Vue's patch under CI load and
    // land against a stale value.
    await expect(composer(page)).toHaveValue("first\n");
    await composer(page).pressSequentially("second");

    await expect(composer(page)).toHaveValue("first\nsecond");
    await expect(page.locator(".chat-msg--me")).toHaveCount(0);
  });

  test("Enter on whitespace-only input is swallowed", async ({ page }) => {
    await openChat(page);
    await composer(page).fill("   ");
    await composer(page).press("Enter");

    await expect(page.locator(".chat-msg--me")).toHaveCount(0);
    // Swallowed, not passed through to the textarea as a newline.
    await expect(composer(page)).toHaveValue("   ");
  });

  test("renders markdown rather than the literal source", async ({ page }) => {
    await openChat(page);
    await composer(page).fill("**bold** and `code` and a list:\n- one\n- two");
    await composer(page).press("Enter");

    const bubble = page.locator(".chat-msg--me .chat-md");
    await expect(bubble.locator("strong")).toHaveText("bold");
    await expect(bubble.locator("code")).toHaveText("code");
    await expect(bubble.locator("li")).toHaveCount(2);
  });

  test("hardens links and never renders an image", async ({ page }) => {
    await openChat(page);
    await composer(page).fill(
      "[docs](https://example.com/a) ![x](https://evil.example/t.png)",
    );
    await composer(page).press("Enter");

    const link = page.locator(".chat-msg--me .chat-md a");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    await expect(page.locator(".chat-msg--me .chat-md img")).toHaveCount(0);
    // The image's URL must not resurface as a second anchor.
    await expect(link).toHaveCount(1);
  });

  test("the copy button puts the exact source on the clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openChat(page);
    await composer(page).fill("```\nwhoami\nid\n```");
    await composer(page).press("Enter");

    await page.locator(".chat-code").hover();
    await page.getByRole("button", { name: "Copy code" }).click();

    // Pins the data-code round-trip end to end: the rendered block splits the
    // source into one span per line, so a handler reading textContent would
    // return "whoamiid" and still pass a substring check.
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("whoami\nid");
  });

  test("stays scrolled to the newest message as the composer grows", async ({
    page,
  }) => {
    await openChat(page);
    // Enough messages that the list actually scrolls.
    for (let i = 0; i < 15; i++) {
      await composer(page).fill(`message ${i}`);
      await composer(page).press("Enter");
    }

    const distanceFromBottom = () =>
      page
        .locator(".chat-messages")
        .evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);

    await expect.poll(distanceFromBottom).toBeLessThanOrEqual(1);

    // Compose a multi-line message. auto-grow takes height from .chat-messages
    // (flex: 1) without changing its scrollTop, so the newest messages scroll
    // out of view mid-compose unless the list is re-pinned on resize.
    await composer(page).fill("line one");
    for (let i = 2; i <= 5; i++) {
      await composer(page).press("Shift+Enter");
      await composer(page).pressSequentially(`line ${i}`);
    }

    await expect.poll(distanceFromBottom).toBeLessThanOrEqual(1);
  });

  test("a wide table scrolls inside its own container instead of stretching the drawer", async ({
    page,
  }) => {
    await openChat(page);
    await composer(page).fill(WIDE_TABLE);
    await composer(page).press("Enter");

    await expect(page.locator(".chat-msg--me .chat-table")).toBeVisible();

    // Regression test: .chat-msg__bubble is a direct flex item in the "me"
    // branch (the "other" branch nests it inside .chat-msg__body), so without
    // an explicit min-width: 0 it keeps min-width: auto, the nowrap cells
    // drive its min-content size past the drawer, and .chat-table's
    // overflow-x never engages. The bubble then blows out to ~613px in a
    // 380px drawer and the message list gains a horizontal scrollbar.
    const messages = page.locator(".chat-messages");
    const { clientWidth, scrollWidth } = await messages.evaluate((el) => ({
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }));
    expect(scrollWidth).toBe(clientWidth);

    // And the table itself is what scrolls.
    const table = page.locator(".chat-msg--me .chat-table");
    const tableScrolls = await table.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(tableScrolls).toBe(true);
  });
});
