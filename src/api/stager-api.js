import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of stagers.
 */
export function getStagers() {
  return axios.get('/stagers')
    .then(({ data }) => data.stagers)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Generate a stager.
 * @param {Object} options options for generating the specific stager.
 */
export function generateStager(options) {
  return axios.post('/stagers', options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Retrieve a stager by its name.
 * @param {string} name name of stager
 */
export function getStagerByName(name) {
  return axios.get(`/stagers/${name}`)
    .then(({ data }) => data.stagers[0])
    .catch((error) => Promise.reject(error.response.data.error));
}
