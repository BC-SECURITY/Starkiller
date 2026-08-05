// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["github"]] : "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  expect: { timeout: process.env.CI ? 10_000 : 5_000 },
  webServer: {
    // --strictPort: fail fast if 5173 is taken (Vite would otherwise pick
    // 5174+ and Playwright would silently hit the wrong app or time out).
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Default suite. grepInvert keeps @docs screenshot captures out of this
    // project, but that alone doesn't exclude them from `playwright test` —
    // with no --project flag every project below runs too. `pnpm test:e2e`
    // passes --project=chromium precisely so it only runs this project.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@docs/,
    },
    // Documentation screenshot capture. Selected by `pnpm docs:screenshots`.
    //
    // channel: "chromium" forces the full Chromium binary. Without it
    // Playwright picks chromium_headless_shell for headless runs and a
    // different binary for headed ones, which rasterize text differently —
    // so the same shot would look different depending on how it was invoked.
    //
    // grep: /@docs/ matches @docs-tagged tests across three files (docs.spec.js,
    // capture.spec.js, scenario.spec.js). fullyParallel: false only serializes
    // tests WITHIN a single file — it does nothing to stop those three files
    // from running concurrently across workers, so without workers: 1 the five
    // real captures in docs.spec.js still race the other @docs specs' browser
    // tests. workers: 1 is what actually keeps this project off a contended
    // CPU; fullyParallel: false on top of that guarantees docs.spec.js's
    // afterAll (which writes result.json) runs exactly once and after all its
    // own tests, rather than racing a same-file parallel worker.
    {
      name: "docs",
      grep: /@docs/,
      fullyParallel: false,
      workers: 1,
      // Explicitly 0 rather than inheriting the base retries: docs.spec.js
      // pushes one entry per test run into the array it writes to result.json,
      // so a retry would record a duplicate and the publish gate's per-asset
      // count check would reject a run that actually succeeded.
      retries: 0,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        // 2:1 frame sized for the docs site's content column — a taller
        // viewport leaves dead space under these short tables. Height is
        // deliberately small; the scenario datasets are sized to fit it (see
        // captureDocsShot's note on fullPage).
        viewport: { width: 1440, height: 720 },
        // Doubles the captured pixels to 2880x1440, which is what
        // capture.spec.js's PNG header assertion pins.
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
        // Every published screenshot is dark-themed; changing this rerenders
        // the whole documentation set.
        colorScheme: "dark",
      },
    },
  ],
});
