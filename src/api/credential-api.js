import { request, handleError } from "@/api/http";

/**
 * Returns a full list of credentials.
 */
export function getCredentials({ tags, search } = {}) {
  return request("/credentials", { params: { tags, search } })
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a single credential.
 */
export function getCredential(id) {
  return request(`/credentials/${id}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Updates a credential.
 */
export function updateCredential(id, options) {
  return request
    .put(`/credentials/${id}`, options)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Create a credential.
 */
export function createCredential(options) {
  return request
    .post("/credentials", options)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a credential.
 */
export function deleteCredential(id) {
  return request
    .delete(`/credentials/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(credentialId, tag) {
  return request
    .delete(`credentials/${credentialId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(credentialId, tag) {
  return request
    .put(`credentials/${credentialId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(credentialId, tag) {
  return request
    .post(`credentials/${credentialId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}
