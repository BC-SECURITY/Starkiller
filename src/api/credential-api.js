import { axiosInstance as axios, handleError } from '@/api/axios-instance';

/**
 * Returns a full list of credentials.
 */
export function getCredentials() {
  return axios.get('/credentials')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a single credential.
 */
export function getCredential(id) {
  return axios.get(`/credentials/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Updates a credential.
 */
export function updateCredential(id, options) {
  return axios.put(`/credentials/${id}`, options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Create a credential.
 */
export function createCredential(options) {
  return axios.post('/credentials', options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a credential.
 */
export function deleteCredential(id) {
  return axios.delete(`/credentials/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}
