import { request, handleError } from "@/api/http";

/**
 * Returns a full list of tags.
 */
export function getTags({
  page,
  limit,
  sortBy = "updated_at",
  sortOrder = "desc",
  query,
  sources,
}) {
  return request("/tags", {
    params: {
      page,
      limit,
      query,
      sources,
      order_by: sortBy,
      order_direction: sortOrder,
    },
  }).catch((error) => Promise.reject(handleError(error)));
}

export function createTag(tag) {
  return request
    .post("/tags", tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(id, tag) {
  return request
    .put(`/tags/${id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(id) {
  return request
    .delete(`/tags/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}
