// Minimal PNG decoder + pixel comparator, built without adding a dependency
// (neither pngjs nor pixelmatch resolves in this repo). Only what
// publish-docs-screenshots.mjs needs to classify "antialiasing jitter" vs
// "real change" is implemented — see the support matrix below.
//
// Supported: bit depth 8, colour type 2 (RGB, 3 channels) or 6 (RGBA, 4
// channels), non-interlaced, deflate compression/filter method 0 (the only
// values IHDR allows anyway), any number of IDAT chunks (a real 2880x1440
// capture was observed split across 30).
//
// Unsupported, and this throws rather than guessing: interlaced (Adam7),
// palette (colour type 3), greyscale (0, 4), 16-bit depth. A silent
// mis-decode would make the skip/copy decision on garbage pixels, which is
// worse than crashing — every screenshot this repo captures is an 8-bit
// RGB/RGBA PNG from Chromium, so hitting one of these is a sign something
// upstream changed, not a case to paper over.

import zlib from "node:zlib";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function readChunks(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("png-compare: not a PNG file (bad signature)");
  }
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    chunks.push({ type, data: buffer.subarray(dataStart, dataStart + length) });
    offset = dataStart + length + 4; // 4 = CRC, not validated — we only read
  }
  return chunks;
}

// PNG's Paeth predictor (spec section 9.4). Picks whichever of the left (a),
// above (b), or upper-left (c) reconstructed byte is closest to a+b-c, with
// ties broken in a, b, c order — the tie-break order is load-bearing.
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Read just the pixel dimensions out of a PNG's IHDR, without inflating the
 * image data. Callers that only need the size (a dimension gate over a set of
 * files) should prefer this over decodePNG — at 2880x1440 a full decode costs
 * roughly 30ms per image, this costs a header read.
 *
 * It is deliberately NOT a validity check: it reads the header and stops, so a
 * file with a good IHDR and corrupt pixel data still returns a size. Use
 * decodePNG when the question is "are these bytes publishable".
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number }}
 */
export function readPngSize(buffer) {
  const ihdrChunk = readChunks(buffer).find((c) => c.type === "IHDR");
  if (!ihdrChunk) throw new Error("png-compare: missing IHDR chunk");
  return {
    width: ihdrChunk.data.readUInt32BE(0),
    height: ihdrChunk.data.readUInt32BE(4),
  };
}

/**
 * Decode a PNG buffer into raw, unfiltered pixel data.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number, channels: number, colorType: number, bitDepth: number, data: Buffer }}
 */
export function decodePNG(buffer) {
  const chunks = readChunks(buffer);
  const ihdrChunk = chunks.find((c) => c.type === "IHDR");
  if (!ihdrChunk) throw new Error("png-compare: missing IHDR chunk");

  const ihdr = ihdrChunk.data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr.readUInt8(8);
  const colorType = ihdr.readUInt8(9);
  const compression = ihdr.readUInt8(10);
  const filterMethod = ihdr.readUInt8(11);
  const interlace = ihdr.readUInt8(12);

  if (interlace !== 0) {
    throw new Error(
      `png-compare: interlaced PNGs (Adam7, interlace=${interlace}) are not supported`,
    );
  }
  if (compression !== 0 || filterMethod !== 0) {
    throw new Error(
      `png-compare: unsupported compression/filter method (${compression}/${filterMethod})`,
    );
  }
  if (bitDepth !== 8) {
    throw new Error(
      `png-compare: only 8-bit depth is supported, got bitDepth=${bitDepth}`,
    );
  }
  if (colorType !== 2 && colorType !== 6) {
    throw new Error(
      `png-compare: unsupported colour type ${colorType} (only 2=RGB and 6=RGBA are supported)`,
    );
  }

  const channels = colorType === 6 ? 4 : 3;

  const idatChunks = chunks.filter((c) => c.type === "IDAT");
  if (idatChunks.length === 0) {
    throw new Error("png-compare: no IDAT chunks found");
  }
  // Concatenate before inflating: zlib's stream spans every IDAT chunk, and
  // a real 2880x1440 capture was observed split across 30 of them — inflating
  // just the first would truncate the image, not error.
  const compressed = Buffer.concat(idatChunks.map((c) => c.data));
  const raw = zlib.inflateSync(compressed);

  const bytesPerPixel = channels; // bit depth 8, so 1 byte/channel/pixel
  const stride = width * bytesPerPixel;
  const expectedLength = (stride + 1) * height; // +1 filter-type byte per row
  if (raw.length !== expectedLength) {
    throw new Error(
      `png-compare: decompressed data length ${raw.length} does not match ` +
        `expected ${expectedLength} for ${width}x${height} channels=${channels}`,
    );
  }

  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filterType = raw[rowStart];
    const srcStart = rowStart + 1;
    const dstStart = y * stride;
    const dstPrevStart = dstStart - stride;

    for (let x = 0; x < stride; x++) {
      const filt = raw[srcStart + x];
      // a/b/c are the left, above, and upper-left already-RECONSTRUCTED
      // bytes, bpp positions back — not the still-filtered source bytes.
      // Using the filtered bytes here is the classic subtle bug: it
      // produces plausible-looking but wrong pixels instead of an error.
      const a = x >= bytesPerPixel ? pixels[dstStart + x - bytesPerPixel] : 0;
      const b = y > 0 ? pixels[dstPrevStart + x] : 0;
      const c =
        y > 0 && x >= bytesPerPixel
          ? pixels[dstPrevStart + x - bytesPerPixel]
          : 0;

      let value;
      switch (filterType) {
        case 0: // None
          value = filt;
          break;
        case 1: // Sub
          value = filt + a;
          break;
        case 2: // Up
          value = filt + b;
          break;
        case 3: // Average
          value = filt + ((a + b) >> 1);
          break;
        case 4: // Paeth
          value = filt + paethPredictor(a, b, c);
          break;
        default:
          throw new Error(
            `png-compare: unsupported scanline filter type ${filterType} on row ${y}`,
          );
      }
      pixels[dstStart + x] = value & 0xff;
    }
  }

  return { width, height, channels, colorType, bitDepth, data: pixels };
}

// Ground truth measured against real 2880x1440 (4,147,200px) capture pairs:
//   - antialiasing jitter:            69 px changed (0.00166%), max delta 5   -> SKIP
//   - antialiasing jitter:            60 px changed (0.00145%), max delta 10  -> SKIP
//   - real change (icon appearing): 4,875 px changed (0.1175%),  max delta 222 -> COPY
// The real change sits BELOW the 0.5% count threshold, so max delta is the
// actual discriminator and the pixel-count check is only a secondary guard.
// ANDed on purpose: either signal saying "real" forces a copy, because a
// wrongly-skipped real change ships a stale doc image while a wrongly-copied
// jitter shot only costs a byte diff.
//
// 24 rather than the 10 those samples alone would need: jitter amplitude varies
// run to run, so a tightly-fitted bound would keep leaking noise into docs PRs.
// It still sits ~9x below the real-change signal, which this dark theme keeps
// wide — real changes swing a pixel from roughly 33 to 200+.
export const MAX_DELTA_THRESHOLD = 24;
export const CHANGED_PIXELS_RATIO_THRESHOLD = 0.005; // 0.5%

/**
 * Compare two PNG buffers pixel-by-pixel.
 * @param {Buffer} bufferA
 * @param {Buffer} bufferB
 * @returns {{ changedPixels: number, totalPixels: number, maxDelta: number, dimensionsDiffer: boolean, channelsDiffer: boolean }}
 */
export function comparePNGs(bufferA, bufferB) {
  const imgA = decodePNG(bufferA);
  const imgB = decodePNG(bufferB);

  const totalPixels = imgA.width * imgA.height;

  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return {
      changedPixels: 0,
      totalPixels,
      maxDelta: Infinity,
      dimensionsDiffer: true,
      channelsDiffer: imgA.channels !== imgB.channels,
    };
  }

  const channelsDiffer = imgA.channels !== imgB.channels;
  const maxChannels = Math.max(imgA.channels, imgB.channels);

  let changedPixels = 0;
  let maxDelta = 0;

  for (let p = 0; p < totalPixels; p++) {
    let pixelChanged = false;
    for (let ch = 0; ch < maxChannels; ch++) {
      // A missing alpha channel reads as fully opaque (255), matching how
      // colour type 2 is defined relative to type 6 — not as 0, which would
      // read as fully transparent and misreport every pixel as changed.
      const va =
        ch < imgA.channels
          ? imgA.data[p * imgA.channels + ch]
          : ch === 3
            ? 255
            : 0;
      const vb =
        ch < imgB.channels
          ? imgB.data[p * imgB.channels + ch]
          : ch === 3
            ? 255
            : 0;
      const delta = Math.abs(va - vb);
      if (delta > 0) pixelChanged = true;
      if (delta > maxDelta) maxDelta = delta;
    }
    if (pixelChanged) changedPixels++;
  }

  return {
    changedPixels,
    totalPixels,
    maxDelta,
    dimensionsDiffer: false,
    channelsDiffer,
  };
}

/**
 * @param {{ changedPixels: number, totalPixels: number, maxDelta: number, dimensionsDiffer: boolean, channelsDiffer?: boolean }} result
 * @returns {boolean} true only when the difference is small enough to be antialiasing jitter.
 */
export function isJitterOnly(result) {
  // Every check below is "return false if provably real", so anything this
  // function cannot evaluate falls through to `return true` — and true means
  // SKIP, which keeps the stale image published. Unrepresentable input is
  // therefore rejected before it reaches the comparisons. NaN is the specific
  // hazard (`NaN > threshold` is false, so a missing count would read as
  // jitter); the booleans are type-checked rather than read for truthiness
  // because an absent flag is falsy, which reads as "no difference".
  if (
    !result ||
    typeof result !== "object" ||
    !Number.isFinite(result.changedPixels) ||
    !Number.isFinite(result.totalPixels) ||
    !Number.isFinite(result.maxDelta) ||
    typeof result.dimensionsDiffer !== "boolean" ||
    typeof result.channelsDiffer !== "boolean" ||
    result.totalPixels <= 0
  ) {
    return false;
  }
  if (result.dimensionsDiffer || result.channelsDiffer) return false;
  if (result.maxDelta > MAX_DELTA_THRESHOLD) return false;
  if (
    result.changedPixels / result.totalPixels >=
    CHANGED_PIXELS_RATIO_THRESHOLD
  ) {
    return false;
  }
  return true;
}
