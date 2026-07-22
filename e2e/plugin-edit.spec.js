// e2e/plugin-edit.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockGeneralFormBackground,
} from "./helpers/network.js";
import { mockPluginDetail } from "./helpers/api/plugins.js";

test.describe("plugin edit", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // PluginEdit.vue's Interact tab mounts <general-form> regardless of
    // which tab is initially active (it isn't lazy the way tab content
    // elsewhere in the app is), so its background fetches always fire.
    await mockGeneralFormBackground(page);
  });

  test("renders a not-loaded plugin's python_deps as inert text, not markdown/HTML", async ({
    page,
  }) => {
    // python_deps is server-reported plugin metadata (attacker-influenced for
    // a malicious/backdoored plugin). Regression test for a stored-XSS sink:
    // this used to render through vue-markdown with html:true inside a
    // ```sh fenced block, so a crafted dependency string containing an
    // embedded closing fence could break out of the fence early and inject
    // a real <img onerror> element or a markdown image/link that beacons to
    // attacker infra — a fenced-block payload without a fence-breakout stays
    // inert even under the old vulnerable code, so the escape sequence below
    // is what actually exercises the sink. It must now render as literal,
    // escaped text regardless.
    const plugin = {
      id: "evilplugin",
      name: "evilplugin",
      loaded: false,
      enabled: false,
      execution_enabled: false,
      authors: [],
      execution_options: {},
      settings_options: {},
      python_deps: [
        '\n```\n<img src=x onerror="window.__xssFired = true">\n![beacon](https://evil.example/beacon.png)\n```\n',
      ],
    };
    await mockPluginDetail(page, plugin);

    await page.goto("/#/plugins/evilplugin");
    await page.getByRole("tab", { name: "Details" }).click();

    // The literal payload text is visible (proves it wasn't stripped).
    await expect(
      page.getByText("<img src=x onerror=", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText("![beacon](https://evil.example/beacon.png)", {
        exact: false,
      }),
    ).toBeVisible();

    // No real <img> element was created from either the raw HTML or the
    // markdown image syntax — proves it rendered as text, not markup.
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    await expect(
      page.locator('img[src="https://evil.example/beacon.png"]'),
    ).toHaveCount(0);

    // The onerror handler never executed.
    const xssFired = await page.evaluate(() => window.__xssFired);
    expect(xssFired).toBeUndefined();
  });

  test("still renders the install command in a distinct monospace block (UX parity with the old markdown rendering)", async ({
    page,
  }) => {
    const plugin = {
      id: "needsdeps",
      name: "needsdeps",
      loaded: false,
      enabled: false,
      execution_enabled: false,
      authors: [],
      execution_options: {},
      settings_options: {},
      python_deps: ["requests", "pyyaml"],
    };
    await mockPluginDetail(page, plugin);

    await page.goto("/#/plugins/needsdeps");
    await page.getByRole("tab", { name: "Details" }).click();

    // The prose and the install command are still two visually distinct
    // pieces (the prose flows as normal text; the command renders in its
    // own monospace block) — the escaping fix must not collapse them into
    // one plain-text blob.
    await expect(page.locator(".plugin-deps-message")).toHaveText(
      "This plugin requires additional Python dependencies. Please install and restart the server.",
    );
    const command = page.locator(".plugin-deps-command");
    await expect(command).toHaveText("poetry add requests pyyaml");
    await expect(command).toHaveCSS("font-family", /mono/i);
  });
});
