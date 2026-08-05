import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const SCRIPT = fileURLToPath(
  new URL("./publish-docs-screenshots.mjs", import.meta.url),
);
const ASSETS = JSON.parse(
  fs.readFileSync(
    fileURLToPath(new URL("../e2e/docs/assets.json", import.meta.url)),
    "utf8",
  ),
);
const FIRST_ASSET = ASSETS[0];

let tmp;
let outputDir;
let assetsDir;
let empireRepo;

function run(env = {}) {
  return execFileSync("node", [SCRIPT], {
    encoding: "utf8",
    // Without this the child's stderr is forwarded to the parent on non-zero
    // exit, so a clean vitest run prints the refusal messages of every failure
    // test above its own green summary and reads like a failure.
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DOCS_OUTPUT_DIR: outputDir,
      EMPIRE_DOCS_REPO: empireRepo,
      ...env,
    },
  });
}

function expectFailure(env = {}) {
  try {
    run(env);
    throw new Error("expected the script to exit non-zero");
  } catch (err) {
    if (!err.status) throw err;
    // stderr alone: matching against stdout too would let text from the
    // success path satisfy an assertion about a refusal.
    return err.stderr;
  }
}

// Writes a complete, publishable run: one PNG per manifest asset and one
// recorded result each. Overrides apply to the FIRST entry only, so a test can
// corrupt one shot while the rest of the set stays valid.
function writeRun({ entryOverrides = {}, topLevelOverrides = {} } = {}) {
  for (const name of ASSETS) {
    fs.writeFileSync(path.join(outputDir, name), `fake-png:${name}`);
  }
  fs.writeFileSync(
    path.join(outputDir, "result.json"),
    JSON.stringify({
      starkillerSha: "abc123def456",
      dirty: false,
      playwrightVersion: "1.59.1",
      results: ASSETS.map((name, i) => ({
        title: `${name} @docs`,
        status: "passed",
        expectedStatus: "passed",
        apiFailures: [],
        consoleErrors: [],
        ...(i === 0 ? entryOverrides : {}),
      })),
      ...topLevelOverrides,
    }),
  );
}

// For the cases no override can express: an entry that is not an object, and a
// results array shorter than the manifest.
function patchResult(mutate) {
  const file = path.join(outputDir, "result.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  mutate(parsed);
  fs.writeFileSync(file, JSON.stringify(parsed));
}

describe("publish-docs-screenshots", () => {
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pub-"));
    outputDir = path.join(tmp, "output");
    empireRepo = path.join(tmp, "empire");
    assetsDir = path.join(empireRepo, "docs", ".gitbook", "assets");
    fs.mkdirSync(outputDir);
    fs.mkdirSync(assetsDir, { recursive: true });
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const published = (name = FIRST_ASSET) =>
    fs.existsSync(path.join(assetsDir, name));

  it("copies every manifest png into the empire assets dir", () => {
    writeRun();
    const out = run();
    for (const name of ASSETS) expect(published(name)).toBe(true);
    expect(out).toMatch(/captured from Starkiller abc123de/);
  });

  it("surfaces a dirty-tree capture in the provenance line", () => {
    // Recorded as its own field so abbreviating the sha can't drop it and
    // attribute the images to a clean commit.
    writeRun({ topLevelOverrides: { dirty: true } });
    expect(run()).toMatch(/abc123de \(dirty tree\)/);
  });

  it("overwrites an existing image rather than skipping it", () => {
    fs.writeFileSync(path.join(assetsDir, FIRST_ASSET), "stale");
    writeRun();
    run();
    expect(fs.readFileSync(path.join(assetsDir, FIRST_ASSET), "utf8")).toBe(
      `fake-png:${FIRST_ASSET}`,
    );
  });

  it("aborts when the capture run did not pass", () => {
    writeRun({ entryOverrides: { status: "failed" } });
    expect(expectFailure()).toMatch(/did not pass/i);
    expect(published()).toBe(false);
  });

  it("aborts when a shot is marked expected-to-fail", () => {
    // status === expectedStatus would accept this; a documentation screenshot
    // has no legitimate reason to be expected-to-fail.
    writeRun({
      entryOverrides: { status: "failed", expectedStatus: "failed" },
    });
    expect(expectFailure()).toMatch(/did not pass/i);
    expect(published()).toBe(false);
  });

  it("aborts when an entry omits status and expectedStatus", () => {
    // `undefined !== undefined` is false, so an unvalidated comparison would
    // classify this entry as passing and publish a failed run.
    writeRun({
      entryOverrides: { status: undefined, expectedStatus: undefined },
    });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when an entry is not an object", () => {
    writeRun();
    patchResult((r) => {
      r.results[0] = null;
    });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when a shot hit a failing api response despite reporting passed", () => {
    writeRun({
      entryOverrides: { apiFailures: ["GET /api/v2/listeners (599)"] },
    });
    const out = expectFailure();
    expect(out).toMatch(/failing \/api\/v2\/ response/i);
    expect(out).toMatch(/\/api\/v2\/listeners/);
    expect(published()).toBe(false);
  });

  it("aborts when a shot raised a page error or console error despite reporting passed", () => {
    writeRun({
      entryOverrides: {
        consoleErrors: ["pageerror: TypeError: Cannot read properties"],
      },
    });
    const out = expectFailure();
    expect(out).toMatch(/page error or console error/i);
    expect(out).toMatch(/Cannot read properties/);
    expect(published()).toBe(false);
  });

  it("aborts when a result entry has a malformed apiFailures field", () => {
    writeRun({ entryOverrides: { apiFailures: undefined } });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when an expected asset is missing", () => {
    // A partial run: --grep or a stray .only captures a subset, and both the
    // image count and the result count shrink together, so only a by-name
    // manifest check catches it.
    writeRun();
    fs.rmSync(path.join(outputDir, FIRST_ASSET));
    const out = expectFailure();
    expect(out).toMatch(/does not match e2e\/docs\/assets\.json/);
    expect(out).toMatch(new RegExp(`Missing: ${FIRST_ASSET}`));
    expect(published(ASSETS[1])).toBe(false);
  });

  it("aborts when an unexpected png is present", () => {
    writeRun();
    fs.writeFileSync(path.join(outputDir, "not_a_documented_asset.png"), "x");
    const out = expectFailure();
    expect(out).toMatch(/Unexpected: not_a_documented_asset\.png/);
    expect(published()).toBe(false);
  });

  it("aborts when the recorded results do not cover every asset", () => {
    writeRun();
    patchResult((r) => r.results.pop());
    const out = expectFailure();
    expect(out).toMatch(/does not describe a complete run/);
    expect(published()).toBe(false);
  });

  it("aborts when starkillerSha is missing, before copying anything", () => {
    // The provenance line is read after the copy loop, so an unvalidated
    // dereference would crash with the empire tree already mutated.
    writeRun({ topLevelOverrides: { starkillerSha: undefined } });
    const out = expectFailure();
    expect(out).toMatch(/starkillerSha/);
    for (const name of ASSETS) expect(published(name)).toBe(false);
  });

  it("aborts when the dirty flag is missing", () => {
    writeRun({ topLevelOverrides: { dirty: undefined } });
    expect(expectFailure()).toMatch(/dirty/);
    expect(published()).toBe(false);
  });

  it("aborts when playwrightVersion is missing", () => {
    writeRun({ topLevelOverrides: { playwrightVersion: undefined } });
    expect(expectFailure()).toMatch(/playwrightVersion/);
    expect(published()).toBe(false);
  });

  it("aborts when result.json is missing", () => {
    fs.writeFileSync(path.join(outputDir, FIRST_ASSET), "fake-png");
    expect(expectFailure()).toMatch(/result\.json/);
    expect(published()).toBe(false);
  });

  it("aborts when result.json is not valid JSON", () => {
    fs.writeFileSync(path.join(outputDir, FIRST_ASSET), "fake-png");
    // Simulates a capture run interrupted mid-write.
    fs.writeFileSync(path.join(outputDir, "result.json"), '{"results": [');
    expect(expectFailure()).toMatch(/not valid JSON/i);
    expect(published()).toBe(false);
  });

  it("aborts when result.json has no results array", () => {
    fs.writeFileSync(path.join(outputDir, FIRST_ASSET), "fake-png");
    fs.writeFileSync(
      path.join(outputDir, "result.json"),
      JSON.stringify({ starkillerSha: "abc123def456" }),
    );
    expect(expectFailure()).toMatch(/results.*array/i);
    expect(published()).toBe(false);
  });

  it("aborts and names the path when the empire repo is missing", () => {
    writeRun();
    expect(expectFailure({ EMPIRE_DOCS_REPO: path.join(tmp, "nope") })).toMatch(
      /nope/,
    );
  });
});
