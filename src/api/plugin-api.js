import { axiosInstance as axios, handleError } from '@/api/axios-instance';

/**
 * Returns a full list of plugins.
 */
export function getPlugins() {
  return axios.get('/plugins')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a plugin by name.
 * This endpoint appears to be broken atm, we just grab the plugin from the list.
 */
export function getPlugin(name) {
  return axios.get(`/plugins/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Execute a plugin command.
 */
export function executePlugin(name, options) {
  return axios.post(`/plugins/${name}/execute`, { options })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
