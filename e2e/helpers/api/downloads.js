// e2e/helpers/api/downloads.js
import { paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/downloads*";

export function mockDownloadsList(page, downloads) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    if (url.pathname.match(/\/downloads\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(downloads));
  });
}
