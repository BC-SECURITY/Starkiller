import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
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

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  return Buffer.concat([
    length,
    Buffer.from(type, "ascii"),
    data,
    Buffer.alloc(4),
  ]);
}

// Minimal valid, uncompressed-filter (type 0 / None) PNG encoder — just enough
// for scripts/png-compare.mjs's decoder to read back. `pixelAt` returns the
// channel values for a given (x, y); solid images pass a constant. `channels`
// picks RGB (3) or RGBA (4) — the RGBA form exists to exercise the
// channelsDiffer path against a same-size RGB destination.
function encodeSolidPng(width, height, pixelAt, channels = 3) {
  const stride = width * channels;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    filtered[rowStart] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const pixel = pixelAt(x, y);
      const off = rowStart + 1 + x * channels;
      for (let c = 0; c < channels; c++) filtered[off + c] = pixel[c];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(channels === 4 ? 6 : 2, 9); // colour type: RGBA or RGB
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(filtered)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

let tmp;
let outputDir;
let assetsDir;
let empireRepo;

function run(env = {}, args = []) {
  return execFileSync("node", [SCRIPT, ...args], {
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

// A small but genuinely decodable PNG, tinted per asset so no two placeholders
// share bytes. Every source image must decode before the script will publish
// anything, so a fixture set of unparseable strings would fail the run before
// reaching the gate any given test is about.
function placeholderPng(name) {
  const tint = [...name].reduce((acc, ch) => (acc + ch.charCodeAt(0)) % 200, 0);
  return encodeSolidPng(4, 4, () => [tint, 100, 150]);
}

// Writes a complete, publishable run: one PNG per manifest asset and one
// recorded result each. Overrides apply to the FIRST entry only, so a test can
// corrupt one shot while the rest of the set stays valid.
//
// `firstAssetBytes` replaces FIRST_ASSET's placeholder with specific bytes —
// the perceptual-skip tests need a known pixel value to compare against, and
// the source-decode test needs bytes that are deliberately not a PNG.
function writeRun({
  entryOverrides = {},
  topLevelOverrides = {},
  firstAssetBytes = null,
} = {}) {
  for (const name of ASSETS) {
    fs.writeFileSync(path.join(outputDir, name), placeholderPng(name));
  }
  if (firstAssetBytes) {
    fs.writeFileSync(path.join(outputDir, FIRST_ASSET), firstAssetBytes);
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
        assets: [name],
        ...(i === 0 ? entryOverrides : {}),
      })),
      ...topLevelOverrides,
    }),
  );
}

// For mutations writeRun's overrides can't express. entryOverrides only
// replaces whole fields, and only on the FIRST entry, so anything that targets
// a different entry, appends to an existing array, swaps an entry for a
// non-object, or changes the length of `results` goes through here.
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
    // "stale" is not a decodable PNG, so the comparison throws and the run
    // takes the fail-open-to-copying branch — which must land the new bytes,
    // not leave the unreadable destination in place.
    fs.writeFileSync(path.join(assetsDir, FIRST_ASSET), "stale");
    writeRun();
    run();
    expect(
      fs
        .readFileSync(path.join(assetsDir, FIRST_ASSET))
        .equals(placeholderPng(FIRST_ASSET)),
    ).toBe(true);
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

  it("aborts when a result entry has a malformed assets field", () => {
    // Every per-entry field is validated up front rather than defaulting a
    // missing one to clean — `assets` included, since the whole set of gates
    // below reads it.
    writeRun({ entryOverrides: { assets: undefined } });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when a result entry has a malformed consoleErrors field", () => {
    // Without the type check, `undefined.length > 0` is never evaluated —
    // the `noisy` filter reads a non-array as "no console errors" and
    // publishes a screenshot whose page may have thrown.
    writeRun({ entryOverrides: { consoleErrors: {} } });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when a result entry has no title", () => {
    // Every refusal message interpolates the title; without it the operator
    // gets "undefined" naming the broken shot.
    writeRun({ entryOverrides: { title: undefined } });
    expect(expectFailure()).toMatch(/malformed result\.json entry/i);
    expect(published()).toBe(false);
  });

  it("aborts when a captured image does not decode as a PNG", () => {
    // A truncated or zero-byte capture (interrupted run, disk full mid
    // screenshot). Without the up-front decode gate this publishes: the
    // comparison throws, the run fails OPEN to copying, and the garbage
    // overwrites a known-good published image while logging "copied".
    writeRun({ firstAssetBytes: Buffer.from("TRUNCATED-GARBAGE") });
    const out = expectFailure();
    expect(out).toMatch(/do not decode as PNGs/);
    expect(out).toContain(FIRST_ASSET);
    // Nothing at all is published — the refusal must precede the copy loop,
    // or Empire's tree is left half-written.
    for (const name of ASSETS) expect(published(name)).toBe(false);
  });

  it("aborts on an empty manifest instead of publishing nothing successfully", () => {
    // The manifest is the only check that notices a shot which silently
    // stopped being captured. An empty one makes every set comparison below
    // it vacuous (empty vs empty), so a run that verified nothing would print
    // "0 copied, 0 skipped of 0 image(s)" and exit 0.
    writeRun();
    const emptyManifest = path.join(tmp, "empty-manifest.json");
    fs.writeFileSync(emptyManifest, "[]");
    const out = expectFailure({ DOCS_ASSETS_MANIFEST: emptyManifest });
    expect(out).toMatch(/must be a non-empty array/);
    expect(published()).toBe(false);
  });

  it("aborts when the manifest is not an array of filenames", () => {
    writeRun();
    const badManifest = path.join(tmp, "bad-manifest.json");
    fs.writeFileSync(badManifest, JSON.stringify({ assets: ["a.png"] }));
    const out = expectFailure({ DOCS_ASSETS_MANIFEST: badManifest });
    expect(out).toMatch(/must be a non-empty array/);
    expect(published()).toBe(false);
  });

  it("aborts when a captured image changed size against the published copy", () => {
    // Decoding proves a file is a PNG, not that it is a publishable
    // screenshot. A degenerate capture — a 1x1, a sliver from a clip locator
    // that matched the wrong element, a deviceScaleFactor regression — decodes
    // fine, and before this gate a size change was only a log line on the way
    // to copying, so it overwrote a good published image and exited 0.
    fs.writeFileSync(
      path.join(assetsDir, FIRST_ASSET),
      encodeSolidPng(8, 8, () => [10, 20, 30]),
    );
    writeRun({ firstAssetBytes: encodeSolidPng(1, 1, () => [10, 20, 30]) });
    const out = expectFailure();
    expect(out).toContain("changed size");
    expect(out).toContain(`${FIRST_ASSET} (8x8 published, 1x1 captured)`);
    // The published image must survive untouched, and the refusal must land
    // before anything else was copied.
    expect(
      fs
        .readFileSync(path.join(assetsDir, FIRST_ASSET))
        .equals(encodeSolidPng(8, 8, () => [10, 20, 30])),
    ).toBe(true);
    expect(published(ASSETS[1])).toBe(false);
  });

  it("--force publishes a size change", () => {
    // The escape hatch for a deliberate resize; without it a legitimate edit
    // to a clipped shot could never be published.
    fs.writeFileSync(
      path.join(assetsDir, FIRST_ASSET),
      encodeSolidPng(8, 8, () => [10, 20, 30]),
    );
    const resized = encodeSolidPng(1, 1, () => [10, 20, 30]);
    writeRun({ firstAssetBytes: resized });
    run({}, ["--force"]);
    expect(
      fs.readFileSync(path.join(assetsDir, FIRST_ASSET)).equals(resized),
    ).toBe(true);
  });

  it("aborts when a copy fails, naming how many were already written", () => {
    // Mid-loop copy failure (EACCES/ENOSPC in the real world; here a
    // destination that is already a directory, which copyFileSync rejects
    // with EISDIR). Deliberately a LATE asset in readdir order: blocking the
    // first one reports "0 image(s) were already written", which would let a
    // lazy assertion pass without ever exercising the count that makes this
    // message worth printing.
    const sorted = [...ASSETS].sort();
    const blocked = sorted[sorted.length - 1];
    writeRun();
    fs.mkdirSync(path.join(assetsDir, blocked));
    const out = expectFailure();
    expect(out).toContain(`failed copying ${blocked}`);
    expect(out).toContain(`${ASSETS.length - 1} image(s) were already written`);
  });

  it("aborts when a manifest asset was never captured", () => {
    // A partial run: --grep or a stray .only captures a subset, and both the
    // image count and the result count shrink together, so only a by-name
    // manifest check catches it.
    writeRun();
    fs.rmSync(path.join(outputDir, FIRST_ASSET));
    const out = expectFailure();
    expect(out).toContain("does not match");
    expect(out).toContain("e2e/docs/assets.json");
    expect(out).toContain(`Missing: ${FIRST_ASSET}`);
    expect(published(ASSETS[1])).toBe(false);
  });

  it("aborts when an unexpected png is present", () => {
    writeRun();
    fs.writeFileSync(path.join(outputDir, "not_a_documented_asset.png"), "x");
    const out = expectFailure();
    expect(out).toMatch(/Unexpected: not_a_documented_asset\.png/);
    expect(published()).toBe(false);
  });

  it("aborts when a file on disk has no recorded result claiming it", () => {
    // The manifest check above only proves the file BELONGS in the set. This
    // is the second half: a manifest-listed image that no recorded (and
    // therefore passed/clean) test claims to have produced — a stale image
    // that survived the beforeAll clean, or a shot that wrote its screenshot
    // and then died before recording it.
    writeRun();
    patchResult((r) => r.results.splice(1, 1));
    const out = expectFailure();
    expect(out).toMatch(/no recorded test result claims them/i);
    expect(out).toContain(ASSETS[1]);
    expect(published()).toBe(false);
  });

  it("aborts when result.json claims an asset that is missing from disk", () => {
    // Recorded result claims a file this run never wrote — a shot's own
    // book-keeping is wrong, or the file was deleted after capture.
    writeRun();
    patchResult((r) => r.results[0].assets.push("phantom.png"));
    const out = expectFailure();
    expect(out).toMatch(/missing from/i);
    expect(out).toMatch(/phantom\.png/);
    expect(published()).toBe(false);
  });

  it("publishes multiple images produced by a single test", () => {
    // The obfuscation @docs test calls captureDocsShot twice — one test
    // entry, two files. A per-run count check (results vs images) would
    // wrongly reject this; the set-of-assets comparison must allow it.
    writeRun();
    patchResult((r) => {
      r.results[0].assets.push(ASSETS[1]);
      r.results.splice(1, 1);
    });
    const out = run();
    for (const name of ASSETS) expect(published(name)).toBe(true);
    expect(out).toContain(ASSETS[1]);
  });

  it("aborts when two results claim the same asset filename", () => {
    // Two tests writing the same filename — the second overwrites the first
    // on disk. A Set-only comparison can't see this: 2 array entries collapse
    // to 1 Set entry, which still equals the 1 real file on disk, so
    // `recorded` vs `onDisk` matches even though a whole capture was silently
    // clobbered. The array-length-vs-Set-size check is the only signal.
    writeRun();
    patchResult((r) => {
      r.results[1].assets = [FIRST_ASSET];
    });
    const out = expectFailure();
    expect(out).toContain(FIRST_ASSET);
    expect(out).toMatch(/more than one test/i);
    expect(published()).toBe(false);
  });

  it("aborts when a recorded result has an empty assets array", () => {
    // Simulates a captureDocsShot call being deleted or made conditional:
    // that test's body still passes with assets: [], so status/apiFailures/
    // consoleErrors all read clean — and the stale copy already committed in
    // Empire would keep publishing forever with no signal it stopped being
    // regenerated.
    writeRun();
    patchResult((r) => {
      r.results[1].assets = [];
    });
    const out = expectFailure();
    expect(out).toMatch(/zero captured assets/i);
    expect(out).toContain(`${ASSETS[1]} @docs`);
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

  it("distinguishes an unreadable result.json from a malformed one", () => {
    // A read error (EACCES, EISDIR) reported as "not valid JSON" would tell
    // the operator to re-run the capture, which fixes neither.
    fs.writeFileSync(path.join(outputDir, FIRST_ASSET), "fake-png");
    fs.mkdirSync(path.join(outputDir, "result.json"));
    const out = expectFailure();
    expect(out).toMatch(/cannot read/i);
    expect(out).not.toMatch(/not valid JSON/i);
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
    // Assert the gate's own wording, not just the path. expectFailure accepts
    // any non-zero exit, and with this gate deleted the run still dies later
    // inside the copy loop with an ENOENT naming the same directory — so a
    // bare /nope/ match passes whether the up-front refusal exists or not.
    writeRun();
    const out = expectFailure({ EMPIRE_DOCS_REPO: path.join(tmp, "nope") });
    expect(out).toMatch(/no docs\/\.gitbook\/assets/);
    expect(out).toMatch(/nope/);
  });

  // These cases pin FIRST_ASSET to specific pixel values so the comparison has
  // a known delta to report, rather than the arbitrary per-name tint
  // placeholderPng assigns.
  describe("perceptual skip", () => {
    // Only FIRST_ASSET is given a pre-existing destination, so it is the only
    // asset the comparison can act on at all; the other 17 have nothing to
    // compare against and always copy as new files. OTHERS is therefore the
    // expected copy count in the one test where FIRST_ASSET is skipped — the
    // rest expect ASSETS.length, including the test that deliberately gives
    // FIRST_ASSET no destination either.
    const OTHERS = ASSETS.length - 1;

    function writePngRun(srcPixelAt, { width = 4, height = 4 } = {}) {
      writeRun({ firstAssetBytes: encodeSolidPng(width, height, srcPixelAt) });
      return path.join(assetsDir, FIRST_ASSET);
    }

    it("skips copying when the destination differs only by antialiasing jitter", () => {
      // 20x20 = 400 total pixels, so 1 changed pixel is 0.25% — under the
      // 0.5% count threshold. (The 4x4 grid used elsewhere in this describe
      // block is too small for that: 1/16 is 6.25%, which would fail the
      // count guard regardless of delta.)
      const destPath = writePngRun(() => [100, 100, 100], {
        width: 20,
        height: 20,
      });
      fs.writeFileSync(
        destPath,
        encodeSolidPng(20, 20, (x, y) =>
          x === 0 && y === 0 ? [105, 100, 100] : [100, 100, 100],
        ),
      );
      const before = fs.readFileSync(destPath);
      const out = run();
      expect(out).toContain(`skipped ${FIRST_ASSET} (1 px, max delta 5)`);
      expect(out).toContain(`${OTHERS} copied, 1 skipped`);
      expect(Buffer.compare(fs.readFileSync(destPath), before)).toBe(0);
    });

    it("copies when the difference exceeds the jitter threshold", () => {
      const destPath = writePngRun(() => [100, 100, 100]);
      // A large delta on one pixel (an icon appearing) must always copy.
      fs.writeFileSync(
        destPath,
        encodeSolidPng(4, 4, (x, y) =>
          x === 0 && y === 0 ? [255, 100, 100] : [100, 100, 100],
        ),
      );
      const out = run();
      expect(out).toContain(`copied ${FIRST_ASSET} (1 px, max delta 155)`);
      expect(out).toContain(`${ASSETS.length} copied, 0 skipped`);
      const srcBytes = fs.readFileSync(path.join(outputDir, FIRST_ASSET));
      expect(Buffer.compare(fs.readFileSync(destPath), srcBytes)).toBe(0);
    });

    it("copies a brand-new file with no prior destination", () => {
      const destPath = writePngRun(() => [1, 2, 3]);
      const out = run();
      expect(out).toContain(`copied ${FIRST_ASSET} (new file)`);
      expect(fs.existsSync(destPath)).toBe(true);
    });

    it("reports colour type differs (not dimensions) when only the channel count changes", () => {
      // Regression for a reproduced bug: an RGB destination vs an RGBA
      // source at identical width/height was logged as "dimensions differ",
      // which is false (dimensions are equal) and discarded the real
      // changedPixels/maxDelta the comparison had already computed. An
      // operator-facing log asserting something untrue is the exact failure
      // this whole mechanism exists to prevent.
      const destPath = writePngRun(() => [1, 2, 3]);
      fs.writeFileSync(
        destPath,
        encodeSolidPng(4, 4, () => [1, 2, 3, 255], 4),
      );
      const out = run();
      expect(out).not.toMatch(/dimensions differ/);
      expect(out).toContain(`copied ${FIRST_ASSET} (colour type differs, `);
      expect(out).toContain(`${ASSETS.length} copied, 0 skipped`);
    });

    it("fails open to copying when the destination cannot be decoded as a PNG", () => {
      // If this ever regresses to `catch { skipped++; continue; }`, a
      // corrupt/foreign destination file would silently keep a stale image
      // published forever instead of being overwritten — the one branch in
      // this mechanism whose failure mode is Critical rather than cosmetic.
      const destPath = writePngRun(() => [1, 2, 3]);
      fs.writeFileSync(destPath, Buffer.alloc(0)); // not a PNG at all
      const out = run();
      expect(out).toContain(`copied ${FIRST_ASSET} (comparison failed: `);
      expect(out).toContain("not a PNG file");
      expect(out).toContain(`${ASSETS.length} copied, 0 skipped`);
      const srcBytes = fs.readFileSync(path.join(outputDir, FIRST_ASSET));
      expect(Buffer.compare(fs.readFileSync(destPath), srcBytes)).toBe(0);
    });

    it("--force copies even when the difference is jitter-only", () => {
      const destPath = writePngRun(() => [100, 100, 100]);
      fs.writeFileSync(
        destPath,
        encodeSolidPng(4, 4, (x, y) =>
          x === 0 && y === 0 ? [105, 100, 100] : [100, 100, 100],
        ),
      );
      const out = run({}, ["--force"]);
      expect(out).toContain(`copied ${FIRST_ASSET} (--force)`);
      expect(out).toContain(`${ASSETS.length} copied, 0 skipped`);
      const srcBytes = fs.readFileSync(path.join(outputDir, FIRST_ASSET));
      expect(Buffer.compare(fs.readFileSync(destPath), srcBytes)).toBe(0);
    });
  });
});
