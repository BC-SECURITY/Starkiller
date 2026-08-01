import { request, handleError } from "@/api/http";

/**
 * Returns a full list of malleable profiles.
 */
export function getMalleableProfiles() {
  return request("/malleable-profiles")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function createMalleableProfile(name, category, code) {
  return request
    .post("/malleable-profiles", { name, category, data: code })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateMalleableProfile(id, code) {
  return request
    .put(`/malleable-profiles/${id}`, { data: code })
    .catch((error) => Promise.reject(handleError(error)));
}

export function getMalleableProfile(id) {
  return request(`/malleable-profiles/${id}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

export function deleteMalleableProfile(id) {
  return request
    .delete(`/malleable-profiles/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function resetProfiles() {
  return request
    .post("/malleable-profiles/reset")
    .catch((error) => Promise.reject(handleError(error)));
}

export function reloadProfiles() {
  return request
    .post("/malleable-profiles/reload")
    .catch((error) => Promise.reject(handleError(error)));
}
