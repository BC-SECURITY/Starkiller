import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of malleable profiles.
 */
export function getMalleableProfiles() {
  return axios.get('/malleable-profiles')
    .then(({ data }) => data.profiles)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function createMalleableProfile(name, category, code) {
  return axios.post('/malleable-profiles', { name, category, data: code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function updateMalleableProfile(name, code) {
  return axios.put(`/malleable-profiles/${name}`, { data: code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function getMalleableProfile(name) {
  return axios.get(`/malleable-profiles/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function deleteMalleableProfile(name) {
  return axios.delete(`/malleable-profiles/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}
