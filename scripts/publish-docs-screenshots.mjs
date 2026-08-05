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

// Validate the whole per-entry contract BEFORE any gate reads a field off it.
// An entry missing `apiFailures` or `consoleErrors` would read as clean via
// the emptiness checks below, and one missing `status` would have satisfied
// the older status-vs-expectedStatus comparison outright. Defaulting any of
// these to "nothing wrong" is the silent blindness this script exists to
// prevent; validating the types up front also buys a precise error message.
const malformed = result.results.filter(
  (r) =>
    !r ||
    typeof r !== "object" ||
    typeof r.status !== "string" ||
    typeof r.expectedStatus !== "string" ||
    !Array.isArray(r.apiFailures) ||
    !Array.isArray(r.consoleErrors),
);
if (malformed.length > 0) {
  fail(
    `malformed result.json entry: each needs string status and expectedStatus, ` +
      `plus array apiFailures and consoleErrors. Got: ` +
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

// Match the manifest by NAME, in both directions. A count check can't catch a
// partial run: a --grep'd capture (or a stray .only — forbidOnly is CI-only
// and this pipeline runs locally) shrinks images and results together and
// looks self-consistent, publishing a few fresh screenshots alongside stale
// ones already in Empire, all attributed to one sha.
const expected = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "e2e", "docs", "assets.json"), "utf8"),
);
const missing = expected.filter((name) => !pngs.includes(name));
const orphaned = pngs.filter((name) => !expected.includes(name));
if (missing.length > 0 || orphaned.length > 0) {
  fail(
    `the captured set does not match e2e/docs/assets.json. ` +
      (missing.length > 0 ? `Missing: ${missing.join(", ")}. ` : "") +
      (orphaned.length > 0 ? `Unexpected: ${orphaned.join(", ")}. ` : "") +
      `Re-run \`pnpm docs:screenshots\` without a --grep filter.`,
  );
}

// One recorded result per expected asset. The docs project pins retries: 0, so
// a count above the manifest means a duplicate producer rather than a retry.
if (result.results.length !== expected.length) {
  fail(
    `${result.results.length} recorded result(s) for ${expected.length} ` +
      `expected asset(s) — result.json does not describe a complete run.`,
  );
}

// Copy failures leave Empire's assets half-written. Name that state rather
// than letting an EACCES/ENOSPC stack trace imply nothing was published.
for (const [i, name] of pngs.entries()) {
  try {
    fs.copyFileSync(path.join(OUTPUT_DIR, name), path.join(assetsDir, name));
  } catch (err) {
    fail(
      `failed copying ${name} (${err.message}). ${i} image(s) were already ` +
        `written to ${assetsDir} — discard them with \`git -C ` +
        `${EMPIRE_REPO} checkout -- docs/.gitbook/assets\` before retrying.`,
    );
  }
  console.log(`published ${name}`);
}

console.log(
  `\n${pngs.length} image(s) -> ${assetsDir}` +
    `\ncaptured from Starkiller ${result.starkillerSha.slice(0, 8)}` +
    `${result.dirty ? " (dirty tree)" : ""} ` +
    `with Playwright ${result.playwrightVersion}` +
    `\n\nReview with: git -C ${EMPIRE_REPO} diff --stat`,
);
