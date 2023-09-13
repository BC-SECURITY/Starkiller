import { axiosInstance as axios, handleError } from "@/api/axios-instance";
import qs from "qs";

/**
 * Returns a full list of credentials.
 */
export function getCredentials({ tags, search } = {}) {
  return axios
    .get("/credentials", {
      params: { tags, search },
      paramsSerializer: (p) =>
        qs.stringify(p, { arrayFormat: "repeat", skipNulls: true }),
    })
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a single credential.
 */
export function getCredential(id) {
  return axios
    .get(`/credentials/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Updates a credential.
 */
export function updateCredential(id, options) {
  return axios
    .put(`/credentials/${id}`, options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Create a credential.
 */
export function createCredential(options) {
  return axios
    .post("/credentials", options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a credential.
 */
export function deleteCredential(id) {
  return axios
    .delete(`/credentials/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(credentialId, tag) {
  return axios
    .delete(`credentials/${credentialId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(credentialId, tag) {
  return axios
    .put(`credentials/${credentialId}/tags/${tag.id}`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(credentialId, tag) {
  return axios
    .post(`credentials/${credentialId}/tags`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
