import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of bypasses.
 */
// eslint-disable-next-line import/prefer-default-export
export function getBypasses() {
  return axios.get('/bypasses')
    .then(({ data }) => data.bypasses)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function getBypass(id) {
  return axios.get(`/bypasses/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function createBypass(name, code) {
  return axios.post('/bypasses', { name, code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function updateBypass(id, name, code) {
  return axios.put(`/bypasses/${id}`, { name, code })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function deleteBypass(id) {
  return axios.delete(`/bypasses/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}