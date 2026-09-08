// e2e/docs/capture.js — page hygiene for documentation screenshots.
//
// The clock is installed AND paused, not setFixedTime: setFixedTime pins Date
// but leaves timers running against wall time, so Vuetify's snackbar timeout
// and AgentsTable's poll cross the capture boundary and the same shot differs
// between a 3s and a 7s wait. install() works through addInitScript, so it only
// affects SUBSEQUENT navigations — hence prepareDocsPage's guard.
//
// A paused clock also freezes requestAnimationFrame, so anything Vue or Vuetify
// drives off rAF (virtual scrollers, <Transition> hooks, VImg's fade) only
// advances when the clock is ticked. See tickUntil and settleImages.

import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import { setFakeAuth } from "../helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "../helpers/network.js";
import { mockUsersList } from "../helpers/api/users.js";
import { FROZEN_TIME } from "./scenario.js";

// __dirname, NOT import.meta: package.json has no "type": "module", so
// Playwright transpiles this file to CommonJS. The inverse applies in
// scripts/publish-docs-screenshots.mjs.
const OUTPUT_DIR = path.join(__dirname, "output");

// The published asset set. scripts/publish-docs-screenshots.mjs reads the same
// file: JSON rather than a shared module because that script is native ESM and
// this one is transpiled to CJS, so neither can import the other.
const DOCS_ASSETS = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets.json"), "utf8"),
);

// >= 5.2 silences App.vue's compatibility warning; >= 4.0 also clears its gate
// for <socket-notifications>, which mounts <chat> and calls getUsers() — hence
// mockUsersList in mockDocsBackground.
const DOCS_EMPIRE_VERSION = "7.0.0";

export function outputDir() {
  return OUTPUT_DIR;
}

// The route mocks and auth every docs page needs before prepareDocsPage.
// Callers add their own per-resource mocks after this; Playwright applies
// routes LIFO, so a later registration wins.
export async function mockDocsBackground(page) {
  await blockSockets(page);
  await setFakeAuth(page);
  await mockEmpireBootstrap(page);
  await mockTagsEndpoint(page);
  await mockUsersList(page, []);
}

// Advance the frozen clock until `check` returns true. Polling rather than
// running a fixed duration, and not an auto-waiting locator: that would wait on
// real Node-side timers for an element gated on frozen in-page rAF, then time
// out with an unrelated-looking "element not found".
export async function tickUntil(page, check) {
  await expect
    .poll(async () => {
      await page.clock.runFor(50);
      return check();
    })
    .toBe(true);
}

// Navigate, then tick the frozen clock to release the app's first-route boot:
// under a clock paused from t=0 the first routed fetch/mount can sit behind a
// setTimeout/rAF that never fires, so the content renders blank while the
// static shell still paints. 500ms is a FLOOR, not a ceiling — it has to clear
// TasksTable's 500ms debounce. Crossing an in-app poll cadence is harmless
// here because every endpoint is mocked, so don't read this as a budget;
// callers needing more settling tick again on top of it.
//
// `tick: 0` skips the advance for pages where the first tick is itself what
// breaks the shot — see settleImages' header for the VTabs case, and the
// plugin-dependencies test that hits it.
export async function gotoDocs(page, url, { tick = 500 } = {}) {
  await page.goto(url);
  if (tick > 0) await page.clock.runFor(tick);
}

// `dir` exists for this helper's own test — pointing it at OUTPUT_DIR would
// delete the real capture set out from under a run. Real callers use the
// default.
export async function emptyOutputDir(dir = OUTPUT_DIR) {
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
}

// Asset filenames captureDocsShot wrote for the CURRENT test: reset in
// docs.spec.js's beforeEach, read back in its afterEach. Filenames rather than
// a count because one test can capture more than once (see "obfuscation
// @docs"), and publish-docs-screenshots.mjs needs to tell that apart from a
// stale or orphaned file.
let capturedNames = [];

export function resetCapturedShots() {
  capturedNames = [];
}

export function capturedShots() {
  return [...capturedNames];
}

// Call AFTER setFakeAuth (init scripts run in registration order, and the
// version patch below rewrites the localStorage entry setFakeAuth wrote) and
// BEFORE page.goto.
export async function prepareDocsPage(page) {
  if (page.url() !== "about:blank") {
    throw new Error(
      `prepareDocsPage must be called before page.goto() — the page is already ` +
        `at ${page.url()}. Relative times are computed once at mount, so a clock ` +
        `installed after navigation is silently ignored.`,
    );
  }

  // Frozen from time zero of page load. Deliberate for a screenshot pipeline,
  // but it means any boot logic gated behind a real setTimeout would hang with
  // no obvious cause — this is the first place to look if that happens.
  await page.clock.install({ time: FROZEN_TIME });
  await page.clock.pauseAt(FROZEN_TIME);

  await page.addInitScript((version) => {
    const raw = localStorage.getItem("application");
    if (!raw) {
      // Throw rather than skip: an unpatched empireVersion means the shot
      // silently carries App.vue's <5.2 warning snackbar. It has to happen
      // in-page — at about:blank there is nothing to read yet, and setFakeAuth
      // writes via its own init script — so it surfaces as a pageerror.
      throw new Error(
        "prepareDocsPage: no persisted `application` state. Call setFakeAuth(page) " +
          "before prepareDocsPage(page) — init scripts run in registration order, " +
          "and this one rewrites the entry setFakeAuth writes.",
      );
    }
    const state = JSON.parse(raw);
    state.empireVersion = version;
    localStorage.setItem("application", JSON.stringify(state));
    // reducedMotion covers media-query-aware animation; this covers the rest.
    // Killing transitions outright keeps partially-interpolated state out of a
    // capture. It does NOT make Vue <Transition> leave hooks resolve
    // synchronously — those advance on rAF, which pauseAt() freezes.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent =
        "*,*::before,*::after{transition:none!important;animation:none!important}";
      document.head.appendChild(style);
    });
  }, DOCS_EMPIRE_VERSION);
}

// Returns a live array accumulating "METHOD url (status)" for every failing
// /api/v2/ response. Assert it is empty before capturing.
//
// Every status >= 400, not just the 599 blockUnmockedApi emits: consoleGuard's
// allowlist tolerates the /^Error:/ http.js logs for any API error, so a mocked
// endpoint drifting to 500 would otherwise publish an empty-table screenshot
// with nothing recorded against it.
export function countFailedApiResponses(page) {
  const hits = [];
  page.on("response", (res) => {
    if (res.status() >= 400 && res.url().includes("/api/v2/")) {
      hits.push(`${res.request().method()} ${res.url()} (${res.status()})`);
    }
  });
  return hits;
}

// VImg wraps its <img> in Vue's <transition name="fade-transition">, whose
// enter hook uses a double rAF to paint the "-enter-from" class (opacity: 0)
// for one frame before removing it. The frozen clock never runs that callback,
// so the image stays invisible while decoded and `complete`. Every captured
// page hits this through SideNav's icon (SideNav.vue:9-11).
//
// Ticking page.clock to unstick it is the wrong tool: this helper runs on every
// shot, and the first tick applied to the plugin-dependencies page flips VTabs'
// mandatory-selection fallback onto a DISABLED tab, hiding the alert that shot
// exists to show. Stripping the leftover "-enter-*" classes is pure DOM
// mutation, so nothing else on the page reacts to it.
//
// The readiness predicate also checks display: VImg v-shows the <img> on
// `state === 'loaded'`, so for one Vue tick after `complete` flips it is
// decoded, class-free and hidden — exiting there would let "-enter-from" land
// after the loop is already gone.
//
// Named "settle", not "wait": it mutates the DOM and throws on a broken asset.
async function settleImages(page) {
  // The Node-side wait covers genuine decode time, which the paused fake clock
  // does not block. `count > 0` is load-bearing alongside the stability check:
  // VImg renders no <img> until its IntersectionObserver fires, so an empty
  // document.images would satisfy readiness vacuously and return after one poll
  // having verified nothing.
  const ceiling = 20;
  let previousCount = null;
  let lastOffender = null;
  let lastCount = 0;
  for (let i = 0; i < ceiling; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const [count, offender, anyBroken] = await page.evaluate(() => {
      const imgs = [...document.images];
      for (const img of imgs) {
        if (!(img.complete && img.naturalWidth > 0)) continue;
        [...img.classList]
          .filter(
            (c) => c.endsWith("-enter-from") || c.endsWith("-enter-active"),
          )
          .forEach((c) => img.classList.remove(c));
      }
      // complete/naturalWidth/opacity confirm the browser decoded the image and
      // nothing is holding it invisible; display closes the decode-vs-paint gap
      // described above this function.
      const notReady = imgs.find((img) => {
        const style = getComputedStyle(img);
        return !(
          img.complete &&
          img.naturalWidth > 0 &&
          style.opacity !== "0" &&
          style.display !== "none"
        );
      });
      // Described here rather than re-found after the loop, which would inspect
      // a DOM one poll newer than the one that actually failed.
      const describe = (img) => {
        const style = getComputedStyle(img);
        return {
          src: img.currentSrc,
          className: img.className,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          opacity: style.opacity,
          display: style.display,
        };
      };
      return [
        imgs.length,
        notReady ? describe(notReady) : null,
        // `complete` is true for a FAILED load too (done trying, not done
        // succeeding), so naturalWidth 0 on a completed load is the signal.
        // currentSrc !== "" rules out the unbound-<img> case, where `complete`
        // is also true per the HTML spec.
        imgs.some(
          (img) =>
            img.complete && img.naturalWidth === 0 && img.currentSrc !== "",
        ),
      ];
    });
    lastOffender = offender;
    lastCount = count;
    if (anyBroken) {
      // Fail loud rather than let a broken asset get cropped out of every
      // screenshot forever — a warning would be indistinguishable from "still
      // loading" to whoever reads the published PNG.
      throw new Error(
        "captureDocsShot: an <img> with a non-empty src finished loading with " +
          "naturalWidth 0 — a broken or missing asset. It would otherwise be " +
          "silently omitted from the capture with no test failure.",
      );
    }
    if (count > 0 && !offender && count === previousCount) return;
    previousCount = count;
    if (i < ceiling - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  // Name the offending image: this helper gates every shot, and a bare timeout
  // with no src or class is expensive to debug from a CI log alone.
  const offender =
    lastCount === 0 ? "no <img> elements on the page" : lastOffender;
  throw new Error(
    "captureDocsShot: at least one <img> was not ready after " +
      `${(ceiling - 1) * 50}ms of real waiting. Either the page rendered no ` +
      "<img> at all (every captured page should have SideNav's icon), the " +
      "image count never stabilised, or an image is stuck at " +
      "opacity:0/display:none from a transition class family this helper's " +
      `-enter-* filter does not cover. Offending image (null when only the ` +
      `count kept changing): ${JSON.stringify(offender)}`,
  );
}

// Settles an opened-then-closed VAutocomplete/VMenu so the shot shows the field
// at rest. `menuId` is the field's aria-controls id, read BEFORE the menu was
// opened — it belongs to the field, so it survives both opening and an
// autocomplete suppressing its placeholder once a selection lands.
//
// Order matters: assert the logical close first ("v-overlay--active" comes
// straight off VOverlay's isActive, so it can't be confused with a menu still
// fading), then tick until the rAF-driven leave hook reaches display:none, then
// blur off the focus ring the test's own verification click left behind. Blur
// goes through document.activeElement because the placeholder locator that
// opened the menu no longer resolves once a selection lands.
//
// The pointer is deliberately left where it is: moving it would trade the
// residual hover border for a hover artifact somewhere else.
export async function closeDocsOverlay(page, menuId) {
  expect(
    menuId,
    "no aria-controls on the field — Vuetify may have stopped exposing it, " +
      "which would make the overlay lookup below resolve to #null",
  ).toBeTruthy();

  const overlay = page.locator(`#${menuId}`);
  // Before the negated assertion, not after: a locator matching zero elements
  // SATISFIES `.not.toHaveClass`, and `.isHidden()` is likewise true for an
  // element that does not exist — so a stale or wrong `menuId` would sail
  // through every overlay-scoped check below having verified nothing.
  await expect(overlay).toHaveCount(1);
  await expect(overlay).not.toHaveClass(/v-overlay--active/);

  const content = overlay.locator(".v-overlay__content");
  await tickUntil(page, () => content.isHidden());
  await expect(page.getByRole("listbox")).toBeHidden();

  await page.evaluate(() => document.activeElement?.blur());
  // Assert the ring is gone rather than trusting the blur landed. Page-wide on
  // purpose: ANY focused field in a docs shot is a mid-interaction artifact.
  await expect(page.locator(".v-field--focused")).toHaveCount(0);
}

// Ticks the clock until `locator` has real height. Anything Vuetify opens
// through VExpandTransition needs this: its onEnter hook collapses the element
// to height:0 synchronously, then restores the real height inside an rAF
// callback that pauseAt() freezes. The contents exist in the DOM and still pass
// toBeVisible(), but are clipped out of the capture entirely.
export async function tickUntilSized(page, locator) {
  await tickUntil(
    page,
    async () =>
      (await locator.evaluate((el) => getComputedStyle(el).height)) !== "0px",
  );
}

// The teleported #app-bar-extension tab strip, which AgentEdit and ListenerEdit
// both render into. VToolbar wraps that slot in a VExpandTransition; its own
// render-time work (isExtended, extensionHeight) is not rAF-gated at all, so
// the height is the only thing that needs waiting on.
export async function tickUntilTabStripSized(page) {
  await tickUntilSized(page, page.locator(".v-toolbar__extension"));
}

// Viewport-only by design: fullPage is a measured no-op because the scenario
// datasets (6 rows at most) fit the 720px viewport, so scrollHeight ===
// clientHeight. Rows must also stay within one page of the smallest
// items-per-page any captured view uses — 10, on the bare <v-data-table> in
// Credentials.vue and Tags.vue. scenario.test.js pins that tighter ceiling.
//
// Pass `clip` as a Locator to capture one element; it delegates to
// locator.screenshot(), which handles teleported Vuetify overlays. `dir` exists
// for this helper's own tests — a probe image in OUTPUT_DIR would make the
// captured set disagree with assets.json.
export async function captureDocsShot(page, assetName, { clip, dir } = {}) {
  // Applies regardless of `clip`: document.images covers the whole document
  // (e.g. the sidebar icon), and a clipped shot sits inside that same document.
  await settleImages(page);

  const target = dir ?? OUTPUT_DIR;
  // Real shots are held to the manifest, so a renamed asset fails at capture
  // time rather than as a confusing set mismatch at publish time.
  if (!dir && !DOCS_ASSETS.includes(assetName)) {
    throw new Error(
      `captureDocsShot: "${assetName}" is not in e2e/docs/assets.json. Add it ` +
        `there (and reference it from Empire's docs) or fix the name — the ` +
        `publish gate matches the captured set against that manifest.`,
    );
  }
  await fs.promises.mkdir(target, { recursive: true });
  const file = path.join(target, assetName);
  if (clip) {
    await clip.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file });
  }
  // Only track shots written to the real OUTPUT_DIR — `dir` is used by this
  // helper's own probes, which must never be mistaken for a published asset.
  if (!dir) capturedNames.push(assetName);
  return file;
}
