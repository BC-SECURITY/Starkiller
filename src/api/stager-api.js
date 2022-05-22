import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single stager.
 */
export function getStager(id) {
  return axios.get(`/stagers/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Returns a full list of stagers.
 */
export function getStagers() {
  return axios.get('/stagers')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Get the options for building a specific type of stager.
 * @param {string} type the type of stager
 */
export function getStagerTemplate(templateId) {
  return axios.get(`/stager-templates/${templateId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Create a stager.
 * @param {Object} options options for generating the specific stager.
 */
export function createStager(template, name, options) {
  return axios.post('/stagers', { name, template, options })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Update a stager.
 * @param {Object} options the options needed for creating a stager.
 */
export function updateStager(id, options) {
  return axios.put(`/stagers/${id}`, options)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response ? error.response.data.detail : error));
}

/**
 * Get the stager templates as an array of strings.
 */
export function getStagerTemplates() {
  return axios.get('/stager-templates')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
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

/**
 * Delete a stager by id.
 * @param {string} id id of the stager to delete
 */
export function deleteStager(id) {
  return axios.delete(`/stagers/${id}`)
    .catch((error) => Promise.reject(error.response.data.detail));
}
