import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single listener.
 */
export function getListener(id) {
  return axios.get(`/listeners/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Returns a full list of listeners.
 */
export function getListeners() {
  return axios.get('/listeners')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Get the options for building a specific type of listener.
 * @param {string} type the type of listener
 */
export function getListenerTemplate(templateId) {
  return axios.get(`/listener-templates/${templateId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Create a listener.
 * @param {Object} options the options needed for creating a listener.
 */
export function createListener(template, options) {
  return axios.post('/listeners', { name: options.Name, template, options })
    .then(({ data }) => data)
    .catch((error) => {
      console.log(error);
      return Promise.reject(error.response ? error.response.data.detail : error);
    });
}

/**
 * Update a listener.
 * @param {Object} options the options needed for creating a listener.
 */
export function updateListener(listener) {
  return axios.put(`/listeners/${listener.id}`, listener)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response ? error.response.data.detail : error));
}

/**
 * Get the listener templates as an array of strings.
 */
export function getListenerTemplates() {
  return axios.get('/listener-templates')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Kill a listener by name.
 * @param {string} name name of the listener to kill
 */
export function killListener(name) {
  return axios.delete(`/listeners/${name}`)
    .catch((error) => Promise.reject(error.response.data.error));
}
