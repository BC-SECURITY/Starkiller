import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single listener.
 */
export function getListener(id) {
  return axios.get(`/listeners/${id}`)
    .then(({ data }) => data.listeners[0])
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Returns a full list of listeners.
 */
export function getListeners() {
  return axios.get('/listeners')
    .then(({ data }) => data.listeners)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get the options for building a specific type of listener.
 * @param {string} type the type of listener
 */
export function getListenerOptions(type) {
  return axios.get(`/listeners/options/${type}`)
    .then(({ data }) => ({ info: data.listenerinfo, options: data.listeneroptions }))
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Validates the listener options. And returns any errors.
 * @param {object} options the listener options
 * @param {string} type the type of listener
 */
export function validateListener(type, options) {
  return axios.post(`/listeners/${type}/validate`, options)
    .then(({ data }) => {
      if (data.error) return data.error;
      return data;
    })
    .catch((error) => Promise.reject(error.response ? error.response.data.error : error));
}

/**
 * Create a listener.
 * This returns a 200 for some errors. Usually when trying to start on a busy port :(
 * @param {Object} options the options needed for creating a listener.
 */
export function createListener(type, options) {
  return axios.post(`/listeners/${type}`, options)
    .then(({ data }) => {
      if (data.error) return Promise.reject(data.error);
      return data;
    })
    .catch((error) => Promise.reject(error.response ? error.response.data.error : error));
}

/**
 * Get the listener types as an array of strings.
 */
export function getListenerTypes() {
  return axios.get('/listeners/types')
    .then(({ data }) => data.types)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Kill a listener by name.
 * @param {string} name name of the listener to kill
 */
export function killListener(name) {
  return axios.delete(`/listeners/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}
