import { axiosInstance as axios, handleError } from "@/api/axios-instance";
import qs from "qs";

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
  return axios
    .get("/tags", {
      params: {
        page,
        limit,
        query,
        sources,
        order_by: sortBy,
        order_direction: sortOrder,
      },
      paramsSerializer: (p) =>
        qs.stringify(p, { arrayFormat: "repeat", skipNulls: true }),
    })
    .then((response) => response.data)
    .catch((error) => Promise.reject(handleError(error)));
}
