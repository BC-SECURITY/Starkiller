// e2e/helpers/api/users.js
import { paginatedResponse } from "../responses.js";

const LIST = "**/api/v2/users*";

export function mockUsersList(page, users) {
  return page.route(LIST, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== "GET") return route.fallback();
    // Skip /users/me (handled by mockEmpireBootstrap) and /users/<id>.
    if (url.pathname.match(/\/users\/[^/]+/)) return route.fallback();
    return route.fulfill(paginatedResponse(users));
  });
}
