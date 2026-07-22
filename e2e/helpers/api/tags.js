// e2e/helpers/api/tags.js
import { jsonResponse, paginatedResponse } from "../responses.js";

// Registry list (used by TagViewer's combobox and the Tags page).
export function mockTagsRegistry(page, tags) {
  return page.route("**/api/v2/tags*", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(paginatedResponse(tags));
  });
}

// Records POST/PUT/DELETE on the global tag registry (**/api/v2/tags**).
export function recordTagRegistryActions(page) {
  const calls = [];
  page.route("**/api/v2/tags**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ method, body });
      return route.fulfill(jsonResponse({ id: 99, ...body }, 201));
    }
    if (method === "PUT") {
      const body = JSON.parse(route.request().postData() || "{}");
      calls.push({ method, body });
      return route.fulfill(jsonResponse({ id: 99, ...body }, 200));
    }
    if (method === "DELETE") {
      calls.push({ method, body: {} });
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fallback();
  });
  return { calls };
}

// Records POST/DELETE on an entity's /tags sub-resource. Attach is by tag_id and
// returns the existing tag row at 200 (the tag is created via the registry first).
export function recordEntityTagActions(page, entityGlob) {
  const calls = { attach: [], detach: [] };
  page.route(entityGlob, (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      const body = JSON.parse(req.postData() || "{}");
      calls.attach.push(body);
      return route.fulfill(
        jsonResponse(
          { id: body.tag_id ?? 42, name: "existing", color: "#2196F3" },
          200,
        ),
      );
    }
    if (req.method() === "DELETE") {
      calls.detach.push(req.url());
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fallback();
  });
  return calls;
}
