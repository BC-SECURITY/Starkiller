import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, expect } from "../fixtures/test.js";
import { blockSockets, mockEmpireBootstrap } from "../helpers/network.js";
import { mockListenersList } from "../helpers/api/listeners.js";
import { scenario, FROZEN_TIME } from "./scenario.js";
import {
  prepareDocsPage,
  mockDocsBackground,
  captureDocsShot,
  countFailedApiResponses,
} from "./capture.js";

// Probe images go to a temp dir, never to e2e/docs/output/. Anything landing
// there would make the captured set disagree with assets.json and abort
// `pnpm docs:publish` before it copies anything.
const PROBE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "docs-capture-"));

test.describe("capture helpers", () => {
  test.afterAll(() => {
    fs.rmSync(PROBE_DIR, { recursive: true, force: true });
  });

  test.beforeEach(async ({ page }) => {
    await mockDocsBackground(page);
  });

  // Most tests here need a rendered page to observe prepareDocsPage's effects
  // on; the listeners table is the cheapest one. Deliberately not in
  // beforeEach — two tests below drive prepareDocsPage/goto themselves,
  // which is the behaviour they exercise.
  async function gotoListeners(page) {
    await mockListenersList(page, scenario.listeners);
    await prepareDocsPage(page);
    await page.goto("/#/listeners");
    await expect(page.getByText("http-primary").first()).toBeVisible();
  }

  test("prepareDocsPage throws if the page already navigated @docs", async ({
    page,
  }) => {
    await mockListenersList(page, scenario.listeners);
    await page.goto("/#/listeners");
    await expect(prepareDocsPage(page)).rejects.toThrow(
      /must be called before/i,
    );
  });

  test("suppresses the version-warning snackbar @docs", async ({ page }) => {
    await gotoListeners(page);
    // App.vue warns when empireVersion satisfies "<5.2"; setFakeAuth seeds
    // "0.0.0-test", so without prepareDocsPage every shot carries this banner.
    await expect(
      page.getByText(/recommended to be used with Empire 5\.2/),
    ).toHaveCount(0);
  });

  test("pins the in-page clock to FROZEN_TIME @docs", async ({ page }) => {
    await gotoListeners(page);
    const now = await page.evaluate(() => Date.now());
    expect(now).toBe(FROZEN_TIME.getTime());
  });

  // The reproducibility claim itself, and the only test that discriminates
  // install()+pauseAt() from setFixedTime — the clock test above passes under
  // either. Verified by weakening prepareDocsPage to setFixedTime alone: this
  // test goes red, because timers resync to wall time and the two captures
  // diverge. (It does NOT pin deviceScaleFactor or channel: both shots share
  // one browser and config, so a change there moves them together.)
  test("captures byte-identical pngs across wall-clock time @docs", async ({
    page,
  }) => {
    await gotoListeners(page);
    const first = await captureDocsShot(page, "determinism_a.png", {
      dir: PROBE_DIR,
    });
    // Real wall-clock separation, deliberately not page.clock.runFor: the
    // point is that time passing OUTSIDE the frozen page cannot leak in.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const second = await captureDocsShot(page, "determinism_b.png", {
      dir: PROBE_DIR,
    });

    expect(fs.readFileSync(first).equals(fs.readFileSync(second))).toBe(true);
  });

  test("captureDocsShot writes a 2880x1440 png @docs", async ({ page }) => {
    await gotoListeners(page);
    const file = await captureDocsShot(page, "capture_probe.png", {
      dir: PROBE_DIR,
    });
    expect(fs.existsSync(file)).toBe(true);
    expect(path.dirname(file)).toBe(PROBE_DIR);

    // PNG IHDR: width at byte offset 16, height at 20, both big-endian uint32.
    const buf = fs.readFileSync(file);
    expect(buf.readUInt32BE(16)).toBe(2880);
    expect(buf.readUInt32BE(20)).toBe(1440);
  });

  // Populated by the test below, asserted on in the afterAll beneath it.
  // test.fail() marks the test expected-to-fail on ANY error, so a false
  // positive is possible: if blockUnmockedApi stopped firing, or listeners
  // got accidentally mocked, expect.poll would just time out and throw —
  // which also satisfies test.fail() and reports green, with no way to tell
  // "the sentinel fired" from "the sentinel never fired" from inside the
  // test alone. afterAll is NOT masked by test.fail(), so recording the
  // observation here and asserting it there turns a silently-passing false
  // positive into a red run. fullyParallel: false on the docs project makes
  // this ordering dependency safe.
  let recordedFailures = null;

  test("countFailedApiResponses records failing /api/v2/ responses @docs", async ({
    page,
  }) => {
    // This test deliberately lets a call reach the blockUnmockedApi sentinel,
    // which raises a page error that consoleGuard fails the test on during
    // teardown. That teardown failure IS the expected outcome, so mark the test
    // as expected-to-fail — Playwright then reports it green. The assertions
    // below still run and still matter; only the teardown failure is tolerated.
    test.fail();

    const failures = countFailedApiResponses(page);
    await prepareDocsPage(page);
    // Listeners deliberately not mocked.
    await page.goto("/#/listeners");
    await expect.poll(() => failures.length).toBeGreaterThan(0);
    recordedFailures = [...failures];
  });

  test.afterAll(() => {
    expect(recordedFailures, "the 599 sentinel never fired").not.toBeNull();
    // Any hit, not recordedFailures[0]: boot order is not what's under test, and
    // a future unmocked request landing first would break this for an
    // unrelated reason.
    expect(
      recordedFailures.some((hit) => hit.includes("/api/v2/listeners")),
    ).toBe(true);
  });
});

test.describe("capture helpers misuse: prepareDocsPage without setFakeAuth", () => {
  // Populated by the test below, asserted on in the afterAll beneath it —
  // same non-vacuous-assertion technique as the sentinel test above, and for
  // the same reason: test.fail() would also report green if the init script
  // never threw at all (e.g. the guard silently regressed to a no-op).
  let thrownMessage = null;

  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await mockEmpireBootstrap(page);
    // Deliberately NOT calling setFakeAuth — that omission is the misuse
    // under test. prepareDocsPage's init script rewrites the `application`
    // localStorage entry setFakeAuth would have written; with no entry to
    // rewrite, it must throw rather than silently skip the version patch.
  });

  test("throws if setFakeAuth was not called first @docs", async ({ page }) => {
    // The init script only runs on navigation, so the throw doesn't surface
    // until goto() below. consoleGuard fails the test on that pageerror
    // during teardown — the expected outcome — so mark it expected-to-fail,
    // same as the sentinel test above.
    test.fail();

    await prepareDocsPage(page);
    const [pageError] = await Promise.all([
      page.waitForEvent("pageerror"),
      page.goto("/#/listeners"),
    ]);
    thrownMessage = pageError.message;
  });

  test.afterAll(() => {
    expect(
      thrownMessage,
      "prepareDocsPage's init-script throw never fired",
    ).not.toBeNull();
    expect(thrownMessage).toMatch(/setFakeAuth/i);
  });
});
