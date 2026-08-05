// e2e/docs/capture.js
//
// Page hygiene for documentation screenshots. Every control here fixes a defect
// that was measured against the real app, not a hypothetical one:
//
// - setFakeAuth seeds empireVersion "0.0.0-test", and App.vue's empireVersion
//   watcher (immediate: true) raises a warning snackbar for anything satisfying
//   "<5.2". Without the override below, every screenshot carries it.
//
// - page.clock.setFixedTime() pins Date but does NOT stop timers: clockSource
//   calls controller.resume(), re-syncing ticks to wall time. Vuetify's 5000ms
//   snackbar timeout and AgentsTable's 8000ms useAutoRefresh poll then cross the
//   capture boundary, so the same shot at a 3s vs 7s wait produced different
//   bytes. install() + pauseAt() genuinely stops them.
//
// - page.clock.install() registers an addInitScript, so it only affects
//   SUBSEQUENT navigations: on an already-loaded page it silently does nothing
//   and you get real wall-clock times with no error. prepareDocsPage throws
//   instead.
//
// - A paused clock also freezes requestAnimationFrame, so anything Vue or
//   Vuetify drives off rAF (virtual scrollers, <Transition> leave hooks) only
//   advances when the clock is ticked. See tickUntil.

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
// Playwright transpiles this file to CommonJS and `import.meta` is unreachable
// from that output — the module would die with "exports is not defined in ES
// module scope" before a single test runs. eslint.config.js's globals.node
// already allowlists __dirname for e2e/**/*.js. The inverse applies in
// scripts/publish-docs-screenshots.mjs.
const OUTPUT_DIR = path.join(__dirname, "output");

// The published asset set. scripts/publish-docs-screenshots.mjs reads the same
// file: JSON rather than a shared module because that script is native ESM and
// this one is transpiled to CJS, so neither can import the other.
const DOCS_ASSETS = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets.json"), "utf8"),
);

// Any version >= 5.2 silences App.vue's compatibility warning. This also clears
// App.vue's >=4.0 gate for <socket-notifications>, which mounts <chat> and
// calls userStore.getUsers() — hence mockUsersList in mockDocsBackground.
// Raising it further would opt these shots into any future version-gated
// feature.
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

// Advance the frozen clock until `check` returns true. prepareDocsPage's
// pauseAt() freezes rAF, so Vuetify's virtual scroller and Vue's <Transition>
// leave hooks make no progress on their own. Polling rather than running a
// fixed duration: an auto-waiting locator would wait on real Node-side timers
// for an element gated on frozen in-page rAF, and time out with an
// unrelated-looking "element not found".
export async function tickUntil(page, check) {
  await expect
    .poll(async () => {
      await page.clock.runFor(50);
      return check();
    })
    .toBe(true);
}

export async function emptyOutputDir() {
  await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
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

  // install()+pauseAt() at the same instant (rather than installing slightly
  // before FROZEN_TIME and pausing after load, as Playwright's own docs
  // suggest) freezes the clock from time zero of page load. That is
  // deliberate for a screenshot pipeline — see the module comment at the top
  // of this file — but it means any boot logic gated behind a real
  // setTimeout would hang with no obvious cause. If a future page needs
  // that, this is the first place to look.
  await page.clock.install({ time: FROZEN_TIME });
  await page.clock.pauseAt(FROZEN_TIME);

  await page.addInitScript((version) => {
    const raw = localStorage.getItem("application");
    if (!raw) {
      // Half-enforcing this contract is worse than not enforcing it: a
      // missing entry means empireVersion is never patched, so the
      // screenshot silently carries App.vue's <5.2 warning snackbar with
      // zero signal that anything went wrong. Throw here (inside the init
      // script — at about:blank there is nothing to read yet, and
      // setFakeAuth only writes via its own addInitScript, so a Node-side
      // pre-check is impossible) so it surfaces as a pageerror instead.
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
    // Killing transitions outright (rather than shortening them) keeps any
    // partially-interpolated state out of a capture. Note this does NOT make
    // Vue <Transition> leave hooks resolve synchronously — those advance on
    // requestAnimationFrame, which pauseAt() freezes, so a closing overlay
    // still needs the clock ticked. See docs.spec.js's menu-close.
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
// allowlist tolerates /^Error:/ (which http.js logs for every API error) and
// 500/401/403 resource failures, so a mocked endpoint drifting to 500 would
// otherwise publish an empty-table screenshot with nothing recorded against
// it. blockUnmockedApi's own console.error runs in the Node route handler, so
// consoleGuard never sees it either — this listener is the only in-band record.
export function countFailedApiResponses(page) {
  const hits = [];
  page.on("response", (res) => {
    if (res.status() >= 400 && res.url().includes("/api/v2/")) {
      hits.push(`${res.request().method()} ${res.url()} (${res.status()})`);
    }
  });
  return hits;
}

// Viewport-only by design. fullPage is a measured no-op because the scenario
// datasets are small enough (5 rows at most) to fit the 720px viewport, so
// scrollHeight === clientHeight and fullPage returns a byte-identical file.
// Adding rows to scenario.js can break that — re-measure before assuming it
// still holds.
//
// Pass `clip` as a Locator to capture one element (delegates to
// locator.screenshot(), which handles teleported Vuetify overlays). Use
// page.screenshot({clip: box}) directly only if the scrim and background are
// wanted in frame.
//
// `dir` exists for the helper's own tests: a probe image written into
// OUTPUT_DIR would make the captured set disagree with assets.json and abort
// `pnpm docs:publish`. Real shots always use the default.
export async function captureDocsShot(page, assetName, { clip, dir } = {}) {
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
  return file;
}
