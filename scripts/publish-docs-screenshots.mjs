#!/usr/bin/env node
//
// Copies captured documentation screenshots into the Empire repo's GitBook
// assets directory.
//
// The result.json gate is the point of this script. consoleGuard asserts during
// fixture TEARDOWN, after the test body has already written its PNG — so a
// failed capture run still leaves images in output/. Copying them would publish
// a screenshot of an empty table. Nothing here launches a browser.
//
// Run directly as `node scripts/publish-docs-screenshots.mjs`, never through
// Playwright's or Vitest's transform. The .mjs extension forces native ESM
// despite package.json lacking "type": "module", so use import.meta.url here;
// `__dirname` (which e2e/docs/capture.js must use instead) is undefined.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  comparePNGs,
  decodePNG,
  isJitterOnly,
  readPngSize,
} from "./png-compare.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// DOCS_OUTPUT_DIR exists so publish-docs-screenshots.test.js can point the
// script at a temp dir. It is not a supported way to publish from an arbitrary
// directory: the gates below assume the docs.spec.js beforeAll clean, so a
// hand-assembled directory can carry stale images the manifest check reads as
// a legitimate set.
const OUTPUT_DIR =
  process.env.DOCS_OUTPUT_DIR ?? path.join(HERE, "..", "e2e", "docs", "output");
// Defaults to a sibling checkout of the matching Empire fork — Empire-Sponsors
// pairs with this sponsors build, so private-main and kali-main need
// EMPIRE_DOCS_REPO set to their own Empire checkout.
const EMPIRE_REPO =
  process.env.EMPIRE_DOCS_REPO ??
  path.join(HERE, "..", "..", "Empire-Sponsors");
// Same rationale as DOCS_OUTPUT_DIR: it exists so the manifest-validation gate
// can be tested against a deliberately broken manifest without editing the
// committed e2e/docs/assets.json out from under a concurrent run. Publishing
// against a hand-written manifest defeats the point of having one.
const MANIFEST_PATH =
  process.env.DOCS_ASSETS_MANIFEST ??
  path.join(HERE, "..", "e2e", "docs", "assets.json");
const FORCE = process.argv.includes("--force");

/** @returns {never} */
function fail(message) {
  console.error(`publish-docs-screenshots: ${message}`);
  process.exit(1);
}

const resultPath = path.join(OUTPUT_DIR, "result.json");
if (!fs.existsSync(resultPath)) {
  fail(
    `no result.json in ${OUTPUT_DIR}. Run \`pnpm docs:screenshots\` first — ` +
      `publishing without it could copy images from a failed run.`,
  );
}

// Read and parse separately. Wrapping both in one try reports an EACCES or
// EISDIR as "not valid JSON" and tells the operator to re-run the capture,
// which fixes neither.
let raw;
try {
  raw = fs.readFileSync(resultPath, "utf8");
} catch (err) {
  fail(`cannot read ${resultPath} (${err.message}).`);
}

let result;
try {
  result = JSON.parse(raw);
} catch (err) {
  fail(
    `${resultPath} is not valid JSON (${err.message}). A capture run was ` +
      `probably interrupted mid-write — re-run \`pnpm docs:screenshots\`.`,
  );
}

if (!Array.isArray(result?.results)) {
  fail(
    `${resultPath} has no \`results\` array. It was not written by ` +
      `e2e/docs/docs.spec.js — re-run \`pnpm docs:screenshots\`.`,
  );
}

// Validated before the copy loop because the provenance line that reads these
// prints after it — an unvalidated dereference would crash with Empire's tree
// already mutated.
if (
  typeof result.starkillerSha !== "string" ||
  typeof result.playwrightVersion !== "string" ||
  typeof result.dirty !== "boolean"
) {
  fail(
    `${resultPath} has no starkillerSha/dirty/playwrightVersion. It was not ` +
      `written by e2e/docs/docs.spec.js — re-run \`pnpm docs:screenshots\`.`,
  );
}

// Validate the whole per-entry contract BEFORE any gate reads a field off it:
// an entry missing `apiFailures`, `consoleErrors` or `assets` would read as
// clean via the emptiness checks below. `title` is included because every
// refusal message interpolates it.
const malformed = result.results.filter(
  (r) =>
    !r ||
    typeof r !== "object" ||
    typeof r.title !== "string" ||
    typeof r.status !== "string" ||
    typeof r.expectedStatus !== "string" ||
    !Array.isArray(r.apiFailures) ||
    !Array.isArray(r.consoleErrors) ||
    !Array.isArray(r.assets),
);
if (malformed.length > 0) {
  fail(
    `malformed result.json entry: each needs string title, status and ` +
      `expectedStatus, plus array apiFailures, consoleErrors and assets. Got: ` +
      malformed.map((r) => JSON.stringify(r)).join("; "),
  );
}

// Both fields must be "passed", rather than merely equal to each other. A
// test.fail()-marked shot records failed/failed, which an equality check would
// accept — and capture.spec.js establishes test.fail() as an idiom in this
// suite, so that is a live copy-paste hazard rather than a hypothetical. A
// documentation screenshot has no legitimate reason to be expected-to-fail.
const bad = result.results.filter(
  (r) => r.status !== "passed" || r.expectedStatus !== "passed",
);
if (bad.length > 0) {
  fail(
    `the capture run did not pass; refusing to publish. Failed: ` +
      bad.map((r) => `${r.title} (${r.status})`).join("; "),
  );
}

// A shot can hit a failing API response while its test body still reports
// "passed", because testInfo.status in afterEach reflects only the body's
// outcome — the assertion on these runs after it. Such a screenshot renders
// empty data, so the recorded URLs are the only signal it is unpublishable.
const brokenApi = result.results.filter((r) => r.apiFailures.length > 0);
if (brokenApi.length > 0) {
  fail(
    `a shot got a failing /api/v2/ response, so its screenshot shows empty ` +
      `data. ` +
      brokenApi
        .map((r) => `${r.title}: ${r.apiFailures.join(", ")}`)
        .join("; "),
  );
}

// consoleGuard asserts in fixture TEARDOWN, after the test body (and its
// afterEach) already ran — so a shot whose page raised an uncaught exception
// or logged a non-allowlisted console.error can still record status="passed"
// with no API failures. consoleErrors is the only signal that such a
// screenshot may be broken.
const noisy = result.results.filter((r) => r.consoleErrors.length > 0);
if (noisy.length > 0) {
  fail(
    `a shot raised a page error or console error, so its screenshot may be ` +
      `broken. ` +
      noisy.map((r) => `${r.title}: ${r.consoleErrors.join(", ")}`).join("; "),
  );
}

const assetsDir = path.join(EMPIRE_REPO, "docs", ".gitbook", "assets");
if (!fs.existsSync(assetsDir)) {
  fail(
    `no docs/.gitbook/assets in ${EMPIRE_REPO}. Set EMPIRE_DOCS_REPO to the ` +
      `Empire checkout.`,
  );
}

const pngs = fs
  .readdirSync(OUTPUT_DIR, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".png"))
  .map((e) => e.name);

// Two independent set comparisons, because neither subsumes the other.
//
// First, the manifest against what is on disk. A count check can't catch a
// partial run: a --grep'd capture (or a stray .only — forbidOnly is CI-only and
// this pipeline runs locally) shrinks the images and the recorded results
// together and looks self-consistent, publishing a few fresh screenshots
// alongside stale ones already in Empire under one sha. assets.json is the
// external anchor that notices.
//
// The manifest is validated, not just read: an empty or malformed one would
// make every set comparison below vacuous and let a run that verified nothing
// print success.
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
} catch (err) {
  fail(`cannot read ${MANIFEST_PATH} (${err.message}).`);
}
if (
  !Array.isArray(manifest) ||
  manifest.length === 0 ||
  !manifest.every((name) => typeof name === "string" && name.length > 0)
) {
  fail(
    `${MANIFEST_PATH} must be a non-empty array of filenames — it is the only ` +
      `check that notices a shot which silently stopped being captured, and ` +
      `an empty one would make every comparison below pass vacuously.`,
  );
}
// Names in `xs` that are absent from `set`. Every gate below is one of these
// in one direction or the other.
const notIn = (xs, set) => [...xs].filter((x) => !set.has(x));

const onDisk = new Set(pngs);
const notCaptured = notIn(manifest, onDisk);
const notInManifest = notIn(pngs, new Set(manifest));
if (notCaptured.length > 0 || notInManifest.length > 0) {
  fail(
    `the captured set does not match ${MANIFEST_PATH}. ` +
      (notCaptured.length > 0 ? `Missing: ${notCaptured.join(", ")}. ` : "") +
      (notInManifest.length > 0
        ? `Unexpected: ${notInManifest.join(", ")}. `
        : "") +
      `Re-run \`pnpm docs:screenshots\` without a --grep filter.`,
  );
}

// Second, what the tests RECORDED capturing against the same disk contents.
// The manifest says which files should exist; this says each one was produced
// by a test that passed the status/api/console gates above. Compare filename
// sets, not counts: one test can legitimately call captureDocsShot more than
// once (e.g. "obfuscation @docs"), so images never equal test entries.
//
// `allAssets` is kept alongside the Set because a Set collapses duplicates. Two
// tests claiming the SAME filename — the second silently overwriting the first
// on disk — yields one PNG and one Set entry but two array entries, so the
// length mismatch is the only signal of it.
const allAssets = result.results.flatMap((r) => r.assets);
const recorded = new Set(allAssets);

if (allAssets.length !== recorded.size) {
  const duplicates = new Set(
    allAssets.filter((name, i) => allAssets.indexOf(name) !== i),
  );
  fail(
    `${[...duplicates].join(", ")} claimed by more than one test result — ` +
      `each captured filename must belong to exactly one test, or the ` +
      `second write silently overwrites the first on disk.`,
  );
}

// A capture test (one whose title matches the @docs convention this run
// filters on) that reports an empty `assets` array produced no screenshot
// at all — most likely a captureDocsShot call was deleted or made
// conditional. That test still shows status="passed" (its assertions ran
// fine), so nothing above catches it, and the stale copy already committed
// in Empire would keep publishing/passing forever with no signal that it
// stopped being regenerated.
const emptyAssets = result.results.filter((r) => r.assets.length === 0);
if (emptyAssets.length > 0) {
  fail(
    `these recorded test results claim zero captured assets — a ` +
      `captureDocsShot call was likely removed or made conditional, so this ` +
      `shot silently stopped being regenerated: ` +
      emptyAssets.map((r) => r.title).join(", "),
  );
}

const missing = notIn(recorded, onDisk);
if (missing.length > 0) {
  fail(
    `result.json records these as captured but they're missing from ` +
      `${OUTPUT_DIR}: ${missing.join(", ")} — re-run \`pnpm docs:screenshots\`.`,
  );
}

const orphaned = notIn(onDisk, recorded);
if (orphaned.length > 0) {
  fail(
    `${orphaned.join(", ")} exist in ${OUTPUT_DIR} but no recorded test ` +
      `result claims them — refusing to publish a file with no associated ` +
      `passed/clean test.`,
  );
}

// Every source image must decode before ANY of them is copied, up front rather
// than inside the loop so a bad source refuses the whole run instead of leaving
// Empire's tree half-written. The perceptual skip below decodes the source too,
// but only on the branch where a destination already exists, and it fails open
// to copying — so a truncated or zero-byte PNG would otherwise ship a broken
// image with a zero exit.
//
// Decoding proves each source IS a PNG, not that it is a publishable
// SCREENSHOT: a 1x1, a sliver clipped from the wrong locator, or a viewport
// regression all decode fine. So each source's size is also held against the
// copy already in Empire. Refusing is safe because a size change is never
// routine — the full-viewport shots are pinned by playwright.config.js and the
// element clips only resize when their content does — and --force is the escape
// hatch. Sizes come from the header, not a third full decode.
const undecodable = [];
const resized = [];
for (const name of pngs) {
  let source;
  try {
    source = decodePNG(fs.readFileSync(path.join(OUTPUT_DIR, name)));
  } catch (err) {
    undecodable.push(`${name} (${err.message})`);
    continue;
  }
  const destPath = path.join(assetsDir, name);
  if (FORCE || !fs.existsSync(destPath)) continue;
  try {
    const dest = readPngSize(fs.readFileSync(destPath));
    if (dest.width !== source.width || dest.height !== source.height) {
      resized.push(
        `${name} (${dest.width}x${dest.height} published, ` +
          `${source.width}x${source.height} captured)`,
      );
    }
  } catch {
    // An unreadable destination is the fail-open-to-copying case the loop
    // below handles and documents; it is not a size change, so it is not this
    // gate's business.
  }
}
if (undecodable.length > 0) {
  fail(
    `these captured images do not decode as PNGs, so publishing them would ` +
      `ship a broken screenshot: ${undecodable.join(", ")} — re-run ` +
      `\`pnpm docs:screenshots\`.`,
  );
}
if (resized.length > 0) {
  fail(
    `these captured images changed size against the copy already in Empire: ` +
      `${resized.join(", ")}. That is either a deliberate edit or a broken ` +
      `capture — and a broken one would overwrite a good screenshot and still ` +
      `report success. Confirm the new images are right, then re-run with ` +
      `--force. Nothing has been copied.`,
  );
}

// Perceptual skip: Chromium screenshots are not byte-reproducible — roughly
// one shot in five per run shows sub-pixel font antialiasing jitter (69 of
// 4,147,200 px, max per-channel delta 5, measured against a real capture).
// Git sees any byte change as a modification, so an unchanged-looking run
// still rewrote several images and added noise to every doc PR. Comparing
// decoded pixels (not bytes) against the file already at the destination
// lets a jitter-only diff be skipped instead of copied. See
// scripts/png-compare.mjs for the threshold and its ground truth.
let copied = 0;
let skipped = 0;

// A copy failure part-way through leaves Empire's assets half-written. Name
// that state rather than letting an EACCES/ENOSPC stack trace imply nothing
// was published. `copied` is the count actually written, so it stays accurate
// however many images the perceptual skip above passed over.
function copyOrFail(srcPath, destPath, name) {
  try {
    fs.copyFileSync(srcPath, destPath);
    // Inside the try so the count can never include a copy that threw — it
    // does not depend on fail() being non-returning.
    copied++;
  } catch (err) {
    fail(
      `failed copying ${name} (${err.message}). ${copied} image(s) were ` +
        `already written to ${assetsDir} — discard them with \`git -C ` +
        `${EMPIRE_REPO} checkout -- docs/.gitbook/assets\` before retrying.`,
    );
  }
}

// Decide WHY this file is being written, then write it once. Skipping is the
// only outcome that does not copy, so it is the only early exit.
for (const name of pngs) {
  const srcPath = path.join(OUTPUT_DIR, name);
  const destPath = path.join(assetsDir, name);
  const existed = fs.existsSync(destPath);
  let reason = existed ? "--force" : "new file";

  if (!FORCE && existed) {
    let cmp = null;
    try {
      cmp = comparePNGs(fs.readFileSync(destPath), fs.readFileSync(srcPath));
    } catch (err) {
      // Reachable only for the DESTINATION — every source is decoded up front
      // and refuses the run, so the bytes about to be written are known-good
      // and only the comparison is unproven. Fail open to copying, never to
      // skipping: a wrongly-skipped real change ships a stale doc image.
      reason = `comparison failed: ${err.message}`;
    }

    if (cmp) {
      const pixels = `${cmp.changedPixels} px, max delta ${cmp.maxDelta}`;
      if (isJitterOnly(cmp)) {
        skipped++;
        console.log(`skipped ${name} (${pixels})`);
        continue;
      }
      // dimensionsDiffer is unreachable: the gate above already refused the run
      // for any size change on this exact branch. Kept as a defensive refusal
      // so that if the two drift apart this copies nothing rather than
      // overwriting a good screenshot with a wrong-sized one. channelsDiffer is
      // a different signal — a same-size RGB-vs-RGBA pair copies.
      if (cmp.dimensionsDiffer) {
        fail(
          `${name} changed size but reached the copy loop — the dimension ` +
            `gate above should already have refused this run. Nothing has ` +
            `been copied for this file.`,
        );
      } else if (cmp.channelsDiffer) {
        reason = `colour type differs, ${pixels}`;
      } else {
        reason = pixels;
      }
    }
  }

  copyOrFail(srcPath, destPath, name);
  console.log(`copied ${name} (${reason})`);
}

console.log(
  `\n${copied} copied, ${skipped} skipped of ${pngs.length} image(s) -> ${assetsDir}` +
    `\ncaptured from Starkiller ${result.starkillerSha.slice(0, 8)}` +
    `${result.dirty ? " (dirty tree)" : ""} ` +
    `with Playwright ${result.playwrightVersion}` +
    `\n\nReview with: git -C ${EMPIRE_REPO} diff --stat`,
);
