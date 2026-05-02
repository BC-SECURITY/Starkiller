// e2e/downloads.spec.js
import { test, expect } from "./fixtures/test.js";
import { setFakeAuth } from "./helpers/auth.js";
import {
  blockSockets,
  mockEmpireBootstrap,
  mockTagsEndpoint,
} from "./helpers/network.js";
import { mockDownloadsList } from "./helpers/api/downloads.js";
import { defaultDownloads } from "./fixtures/downloads.js";

test.describe("downloads", () => {
  test.beforeEach(async ({ page }) => {
    await blockSockets(page);
    await setFakeAuth(page);
    await mockEmpireBootstrap(page);
    // Downloads.vue calls getTags() on mount (sources=download).
    await mockTagsEndpoint(page);
    await mockDownloadsList(page, defaultDownloads);
  });

  test("renders downloads list", async ({ page }) => {
    await page.goto("/#/downloads");
    await expect(page.getByText("report.txt")).toBeVisible();
  });
});
