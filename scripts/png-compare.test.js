import zlib from "node:zlib";
import { describe, it, expect } from "vitest";
import {
  decodePNG,
  readPngSize,
  comparePNGs,
  isJitterOnly,
  MAX_DELTA_THRESHOLD,
  CHANGED_PIXELS_RATIO_THRESHOLD,
} from "./png-compare.mjs";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  // CRC is never validated by the decoder under test; a fixed placeholder
  // is enough to produce structurally-valid chunk framing.
  const crc = Buffer.alloc(4);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function ihdr({ width, height, bitDepth = 8, colorType = 2, interlace = 0 }) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(bitDepth, 8);
  data.writeUInt8(colorType, 9);
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter method
  data.writeUInt8(interlace, 12);
  return chunk("IHDR", data);
}

// Deliberately encode raw scanlines with a caller-chosen filter type per row,
// so decode tests exercise the actual un-filtering maths rather than
// round-tripping through zlib's own filter heuristic (which always picks 0
// for tiny synthetic images and would never touch Sub/Up/Average/Paeth).
function encodePNG(rows, { colorType = 2, splitIntoChunks = 1 } = {}) {
  const height = rows.length;
  const width = rows[0].pixels.length;
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;

  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const { filterType, pixels } = rows[y];
    const rowStart = y * (stride + 1);
    filtered[rowStart] = filterType;

    // Raw (unfiltered) bytes for this row and the previous one, needed to
    // compute a/b/c for each filter type.
    const raw = pixels.flat();
    const prevRaw =
      y > 0 ? rows[y - 1].pixels.flat() : new Array(stride).fill(0);

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? raw[x - channels] : 0;
      const b = prevRaw[x];
      const c = x >= channels ? prevRaw[x - channels] : 0;
      let filtByte;
      switch (filterType) {
        case 0:
          filtByte = raw[x];
          break;
        case 1:
          filtByte = raw[x] - a;
          break;
        case 2:
          filtByte = raw[x] - b;
          break;
        case 3:
          filtByte = raw[x] - ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          filtByte = raw[x] - pred;
          break;
        }
        default:
          throw new Error(
            `test encoder: unsupported filter type ${filterType}`,
          );
      }
      filtered[rowStart + 1 + x] = filtByte & 0xff;
    }
  }

  const compressed = zlib.deflateSync(filtered);
  const idatChunks = [];
  if (splitIntoChunks <= 1) {
    idatChunks.push(chunk("IDAT", compressed));
  } else {
    const chunkSize = Math.ceil(compressed.length / splitIntoChunks);
    for (let i = 0; i < compressed.length; i += chunkSize) {
      idatChunks.push(chunk("IDAT", compressed.subarray(i, i + chunkSize)));
    }
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    ihdr({ width, height, colorType }),
    ...idatChunks,
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// A 2x2 RGB image with varied channel values so Sub/Up/Average/Paeth all see
// non-trivial deltas between neighbouring pixels.
const RGB_ROWS = [
  {
    filterType: 0, // filled in per-test
    pixels: [
      [10, 20, 30],
      [200, 100, 50],
    ],
  },
  {
    filterType: 0,
    pixels: [
      [5, 250, 128],
      [90, 15, 240],
    ],
  },
];

function rowsWithFilter(filterType) {
  return RGB_ROWS.map((row) => ({ ...row, filterType }));
}

function expectedPixels(rows) {
  return Buffer.from(rows.flatMap((r) => r.pixels.flat()));
}

describe("decodePNG", () => {
  for (const filterType of [0, 1, 2, 3, 4]) {
    it(`round-trips filter type ${filterType}`, () => {
      const png = encodePNG(rowsWithFilter(filterType));
      const decoded = decodePNG(png);
      expect(decoded.width).toBe(2);
      expect(decoded.height).toBe(2);
      expect(decoded.channels).toBe(3);
      expect(Buffer.compare(decoded.data, expectedPixels(RGB_ROWS))).toBe(0);
    });
  }

  it("decodes identically whether IDAT is one chunk or split across many", () => {
    const single = decodePNG(
      encodePNG(rowsWithFilter(4), { splitIntoChunks: 1 }),
    );
    const split = decodePNG(
      encodePNG(rowsWithFilter(4), { splitIntoChunks: 7 }),
    );
    expect(Buffer.compare(single.data, split.data)).toBe(0);
    expect(split.width).toBe(single.width);
    expect(split.height).toBe(single.height);
  });

  it("decodes colour type 2 (RGB, 3 channels)", () => {
    const decoded = decodePNG(encodePNG(rowsWithFilter(0), { colorType: 2 }));
    expect(decoded.channels).toBe(3);
    expect(decoded.colorType).toBe(2);
  });

  it("decodes colour type 6 (RGBA, 4 channels)", () => {
    const rgbaRows = [
      {
        filterType: 1,
        pixels: [
          [10, 20, 30, 255],
          [200, 100, 50, 128],
        ],
      },
      {
        filterType: 4,
        pixels: [
          [5, 250, 128, 0],
          [90, 15, 240, 64],
        ],
      },
    ];
    const decoded = decodePNG(encodePNG(rgbaRows, { colorType: 6 }));
    expect(decoded.channels).toBe(4);
    expect(decoded.colorType).toBe(6);
    expect(Buffer.compare(decoded.data, expectedPixels(rgbaRows))).toBe(0);
  });

  it("throws on interlaced PNGs", () => {
    const png = Buffer.concat([
      PNG_SIGNATURE,
      ihdr({ width: 2, height: 2, interlace: 1 }),
      chunk("IDAT", Buffer.alloc(0)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    expect(() => decodePNG(png)).toThrow(/interlac/i);
  });

  it("throws on palette colour type (3)", () => {
    const png = Buffer.concat([
      PNG_SIGNATURE,
      ihdr({ width: 2, height: 2, colorType: 3 }),
      chunk("IDAT", Buffer.alloc(0)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    expect(() => decodePNG(png)).toThrow(/colour type/i);
  });

  it("throws on 16-bit depth", () => {
    const png = Buffer.concat([
      PNG_SIGNATURE,
      ihdr({ width: 2, height: 2, bitDepth: 16 }),
      chunk("IDAT", Buffer.alloc(0)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    expect(() => decodePNG(png)).toThrow(/8-bit/i);
  });

  it("throws on greyscale colour types", () => {
    const png = Buffer.concat([
      PNG_SIGNATURE,
      ihdr({ width: 2, height: 2, colorType: 0 }),
      chunk("IDAT", Buffer.alloc(0)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    expect(() => decodePNG(png)).toThrow(/colour type/i);
  });

  // The round-trip tests above are inverse-consistent rather than
  // spec-anchored: this file's own encoder derives a/b/c and the Paeth
  // predictor the same way the decoder does, so a misreading shared by both
  // would round-trip cleanly without being caught. This fixture breaks that
  // symmetry — it was encoded by Pillow (libpng), a mature, independent
  // implementation, not by anything in this file. Generated with:
  //   python3 -c "
  //   from PIL import Image
  //   img = Image.new('RGB', (8, 8))
  //   px = img.load()
  //   for y in range(8):
  //       for x in range(8):
  //           px[x, y] = ((x*30) % 256, (y*37) % 256, ((x+y)*19) % 256)
  //   img.save('fixture.png')"
  // then base64-encoded (84 bytes). Inspecting the inflated IDAT at
  // generation time showed row 0 filtered with type 1 (Sub) and rows 1-7
  // with type 4 (Paeth) — Pillow's own filter-selection heuristic picked
  // Paeth for six of eight rows here without being asked to, so this
  // exercises the same predictor the decoder implements, encoded by
  // someone else's code.
  const PILLOW_FIXTURE_8X8_RGB_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAG0lEQVR4nGNkYGCQYxDGRCwMqsIMDFjQ4JQAANDLBqCE/vdzAAAAAElFTkSuQmCC";

  it("decodes an 8x8 fixture encoded independently by Pillow, not this file's own encoder", () => {
    const buffer = Buffer.from(PILLOW_FIXTURE_8X8_RGB_BASE64, "base64");
    const decoded = decodePNG(buffer);
    expect(decoded.width).toBe(8);
    expect(decoded.height).toBe(8);
    expect(decoded.channels).toBe(3);

    const expected = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        expected.push((x * 30) % 256, (y * 37) % 256, ((x + y) * 19) % 256);
      }
    }
    expect(Buffer.compare(decoded.data, Buffer.from(expected))).toBe(0);
  });
});

describe("readPngSize", () => {
  it("reads dimensions without inflating the image data", () => {
    const png = encodePNG(rowsWithFilter(0));
    expect(readPngSize(png)).toEqual({ width: 2, height: 2 });
  });

  it("agrees with decodePNG on a real capture-sized header", () => {
    // Same source of truth, two costs — if these ever disagree the cheap
    // dimension gate in publish-docs-screenshots.mjs is reading the wrong
    // bytes.
    const png = encodePNG(rowsWithFilter(4), { colorType: 6 });
    const decoded = decodePNG(png);
    expect(readPngSize(png)).toEqual({
      width: decoded.width,
      height: decoded.height,
    });
  });

  it("throws when there is no IHDR", () => {
    const png = Buffer.concat([PNG_SIGNATURE, chunk("IEND", Buffer.alloc(0))]);
    expect(() => readPngSize(png)).toThrow(/IHDR/);
  });
});

describe("comparePNGs / isJitterOnly", () => {
  function solidImage(width, height, [r, g, b], overrides = []) {
    const pixels = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const override = overrides.find((o) => o.x === x && o.y === y);
        row.push(override ? override.rgb : [r, g, b]);
      }
      pixels.push({ filterType: 0, pixels: row });
    }
    return encodePNG(pixels);
  }

  it("skips a synthetic pair differing by a small delta on a handful of pixels", () => {
    const width = 100;
    const height = 100;
    const base = solidImage(width, height, [100, 100, 100]);
    // 3 pixels nudged by delta 5 out of 10,000 total (0.03%) is well under
    // both thresholds, proving the logic rather than just re-asserting the
    // exact ground-truth numbers.
    const jittered = solidImage(
      width,
      height,
      [100, 100, 100],
      [
        { x: 0, y: 0, rgb: [105, 100, 100] },
        { x: 1, y: 0, rgb: [95, 100, 100] },
        { x: 2, y: 0, rgb: [100, 105, 100] },
      ],
    );
    const result = comparePNGs(base, jittered);
    expect(result.changedPixels).toBe(3);
    expect(result.maxDelta).toBe(5);
    expect(result.maxDelta).toBeLessThanOrEqual(MAX_DELTA_THRESHOLD);
    expect(result.changedPixels / result.totalPixels).toBeLessThan(
      CHANGED_PIXELS_RATIO_THRESHOLD,
    );
    expect(isJitterOnly(result)).toBe(true);
  });

  it("skips the delta-10 jitter observation that motivated raising the threshold from 8 to 24", () => {
    // A second real capture of the same shot showed 60/4,147,200 px changed
    // at max delta 10 -- higher than the original delta-5 sample -- while a
    // third run of that same shot came back byte-identical. That proved
    // jitter amplitude varies run to run and can exceed a threshold fitted
    // tightly to one observation. Nothing between the old bound (8) and the
    // new one (24) was covered before this test.
    const width = 100;
    const height = 100;
    const base = solidImage(width, height, [100, 100, 100]);
    const jittered = solidImage(
      width,
      height,
      [100, 100, 100],
      [
        { x: 0, y: 0, rgb: [110, 100, 100] }, // delta 10
      ],
    );
    const result = comparePNGs(base, jittered);
    expect(result.maxDelta).toBe(10);
    expect(isJitterOnly(result)).toBe(true);
  });

  it("pins MAX_DELTA_THRESHOLD from both sides: delta 24 skips, delta 25 copies", () => {
    // Deliberately hardcoded (not expressed as MAX_DELTA_THRESHOLD +/- 1) so
    // that changing the constant without updating this test fails loudly,
    // instead of the test silently tracking whatever the constant becomes.
    const width = 100;
    const height = 100;
    const base = solidImage(width, height, [100, 100, 100]);

    const atThreshold = solidImage(
      width,
      height,
      [100, 100, 100],
      [
        { x: 0, y: 0, rgb: [124, 100, 100] }, // delta 24
      ],
    );
    const atResult = comparePNGs(base, atThreshold);
    expect(atResult.maxDelta).toBe(24);
    expect(isJitterOnly(atResult)).toBe(true);

    const justAbove = solidImage(
      width,
      height,
      [100, 100, 100],
      [
        { x: 0, y: 0, rgb: [125, 100, 100] }, // delta 25
      ],
    );
    const aboveResult = comparePNGs(base, justAbove);
    expect(aboveResult.maxDelta).toBe(25);
    expect(isJitterOnly(aboveResult)).toBe(false);
  });

  it("copies (does not classify as jitter) a pair differing by delta 222", () => {
    const width = 10;
    const height = 10;
    const base = solidImage(width, height, [10, 10, 10]);
    const changed = solidImage(
      width,
      height,
      [10, 10, 10],
      [
        { x: 5, y: 5, rgb: [232, 10, 10] }, // delta 222
      ],
    );
    const result = comparePNGs(base, changed);
    expect(result.maxDelta).toBe(222);
    expect(isJitterOnly(result)).toBe(false);
  });

  it("reports dimensionsDiffer and does not classify as jitter when sizes differ", () => {
    const a = solidImage(4, 4, [1, 2, 3]);
    const b = solidImage(5, 4, [1, 2, 3]);
    const result = comparePNGs(a, b);
    expect(result.dimensionsDiffer).toBe(true);
    expect(isJitterOnly(result)).toBe(false);
  });

  it("treats a large fraction of small-delta pixels as a real change (count guard)", () => {
    const width = 20;
    const height = 20; // 400 total pixels
    const base = solidImage(width, height, [50, 50, 50]);
    const overrides = [];
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        overrides.push({ x, y, rgb: [55, 50, 50] }); // delta 5, but 25/400 = 6.25%
      }
    }
    const changed = solidImage(width, height, [50, 50, 50], overrides);
    const result = comparePNGs(base, changed);
    expect(result.maxDelta).toBeLessThanOrEqual(MAX_DELTA_THRESHOLD);
    expect(result.changedPixels / result.totalPixels).toBeGreaterThanOrEqual(
      CHANGED_PIXELS_RATIO_THRESHOLD,
    );
    expect(isJitterOnly(result)).toBe(false);
  });

  // "true" means SKIP, which keeps the already-published image. That is the
  // only direction in this mechanism that can ship a stale doc image, so any
  // input the predicate cannot actually evaluate must come back false. Every
  // case below would otherwise reach `return true` by falling through the
  // comparisons: NaN and undefined make both `>` and `>=` false.
  it.each([
    [
      "a zero-pixel image (changedPixels/totalPixels is NaN)",
      { totalPixels: 0 },
    ],
    ["a NaN maxDelta", { maxDelta: NaN }],
    ["an undefined changedPixels", { changedPixels: undefined }],
    ["an undefined totalPixels", { totalPixels: undefined }],
    ["an undefined maxDelta", { maxDelta: undefined }],
  ])("refuses to call %s jitter", (_label, overrides) => {
    const base = {
      changedPixels: 0,
      totalPixels: 400,
      maxDelta: 0,
      dimensionsDiffer: false,
      channelsDiffer: false,
    };
    // The unmodified baseline IS jitter, so each case below fails only because
    // of its own override rather than because the fixture was never valid.
    expect(isJitterOnly(base)).toBe(true);
    expect(isJitterOnly({ ...base, ...overrides })).toBe(false);
  });

  it("refuses to call a missing or non-object result jitter", () => {
    expect(isJitterOnly(undefined)).toBe(false);
    expect(isJitterOnly(null)).toBe(false);
    expect(isJitterOnly("not a result")).toBe(false);
    expect(isJitterOnly({})).toBe(false);
  });
});
