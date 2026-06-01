import { request, handleError } from "@/api/http";

/**
 * Returns a full list of tags.
 */
// eslint-disable-next-line import/prefer-default-export
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
