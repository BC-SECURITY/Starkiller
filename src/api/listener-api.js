import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of listeners.
 */
export function getListeners() {
  return axios.get('/listeners')
    .then(({ data }) => data.listeners)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Get the options for building a specific type of listener.
 * @param {string} type the type of listener
 */
export function getListenerOptions(type) {
  return axios.get(`/listeners/options/${type}`)
    .then(({ data }) => data.listeneroptions)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Create a listener.
 * @param {Object} options the options needed for creating a listener.
 */
export function createListener(type, options) {
  return axios.post(`/listeners/${type}`, options)
    .then(({ data }) => data)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Get the listener types as an array of strings.
 */
export function getListenerTypes() {
  return axios.get('/listeners/types')
    .then(({ data }) => data.types)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Kill a listener by name.
 * @param {string} name name of the listener to kill
 */
export function killListener(name) {
  return axios.delete(`/listeners/${name}`)
    .then(({ data }) => data)
    .catch(error => Promise.reject(error.response.data.error));
}
