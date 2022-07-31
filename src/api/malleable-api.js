import { axiosInstance as axios, handleError } from '@/api/axios-instance';

/**
 * Returns a full list of malleable profiles.
 */
export function getMalleableProfiles() {
  return axios.get('/malleable-profiles')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function createMalleableProfile(name, category, code) {
  return axios.post('/malleable-profiles', { name, category, data: code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateMalleableProfile(id, code) {
  return axios.put(`/malleable-profiles/${id}`, { data: code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getMalleableProfile(id) {
  return axios.get(`/malleable-profiles/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteMalleableProfile(id) {
  return axios.delete(`/malleable-profiles/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
