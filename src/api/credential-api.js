import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of credentials.
 */
export function getCredentials() {
  return axios.get('/creds')
    .then(({ data }) => data.creds)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Returns a single credential.
 */
export function getCredential(id) {
  return axios.get(`/creds/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Updates a credential.
 */
export function updateCredential(id, options) {
  return axios.put(`/creds/${id}`, options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Create a credential.
 */
export function createCredential(options) {
  return axios.post('/creds', options)
    .then(({ data }) => {
      if (data.error) return Promise.reject(data.error);
      return data;
    })
    .catch((error) => Promise.reject(error.response ? error.response.data.error : error));
}

/**
 * Delete a credential.
 */
export function deleteCredential(id) {
  return axios.delete(`/creds/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}
