// e2e/helpers/responses.js
//
// Tiny wrappers around the response objects that page.route().fulfill() expects.
// jsonResponse: any JSON payload. paginatedResponse: Empire's standard list
// envelope, which is { records: [...], total, limit, page } for every list
// endpoint in src/api/*.js. The recordsKey override exists for getDirectory,
// which uses { children: [...] } instead.

export function jsonResponse(data, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  };
}

export function paginatedResponse(items, { recordsKey = "records" } = {}) {
  return jsonResponse({
    [recordsKey]: items,
    total: items.length,
    limit: 100,
    page: 1,
  });
}
