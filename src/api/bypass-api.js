import { request, handleError } from "@/api/http";

/**
 * Returns a full list of bypasses.
 */
export function getBypasses() {
  return request("/bypasses")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getBypass(id) {
  return request(`/bypasses/${id}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

export function createBypass(name, code, language) {
  return request
    .post("/bypasses", { name, code, language })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateBypass(id, name, code, language) {
  return request
    .put(`/bypasses/${id}`, { name, code, language })
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteBypass(id) {
  return request
    .delete(`/bypasses/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function reloadBypasses() {
  return request
    .post("/bypasses/reload")
    .catch((error) => Promise.reject(handleError(error)));
}

export function resetBypasses() {
  return request
    .post("/bypasses/reset")
    .catch((error) => Promise.reject(handleError(error)));
}
