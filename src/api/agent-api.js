import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single agent.
 */
export function getAgent(name) {
  return axios.get(`/agents/${name}`)
    .then(({ data }) => data.agents[0])
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Returns a full list of agents.
 */
export function getAgents() {
  return axios.get('/agents')
    .then(({ data }) => data.agents)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Rename an agent.
 * @param {string} oldName
 * @param {string} newName
 */
export function renameAgent(oldName, newName) {
  return axios.post(`/agents/${oldName}/rename`, { newname: newName })
    .then(({ data }) => data.success)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Kill an agent.
 * @param {string} name agent name
 */
export function killAgent(name) {
  return axios.post(`/agents/${name}/kill`)
    .then(({ data }) => data.success)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Remove an agent.
 * @param {string} name agent name
 */
export function removeAgent(name) {
  return axios.delete(`/agents/${name}`)
    .then(({ data }) => data.success)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get a single task
 * @param {string} name agent name
 */
export function getTask(name, taskId) {
  return axios.get(`/agents/${name}/task/${taskId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get tasking results for an agent.
 * @param {string} name agent name
 */
export function getResults(name, since) {
  const query = (since && since.length > 0) ? { updated_since: since } : {};

  return axios.get(`/agents/${name}/results`, { params: query })
    .then(({ data }) => data.results)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get directory's files.
 * @param {string} name agent name
 */
export function getDirectory(name, directory) {
  return axios.get(`/agents/${name}/directory?directory=${directory}`)
    .then(({ data }) => data.items)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Task an agent to scrape a directory.
 * @param {string} name agent name
 */
export function scrapeDirectory(name, directory) {
  return axios.post(`/agents/${name}/directory?directory=${directory}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Task an agent to run a shell command.
 * @param {string} name agent name
 */
export function shell(name, command) {
  return axios.post(`/agents/${name}/shell`, { command })
    .then(({ data }) => data.taskID)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Clear the queued tasks for an agent.
 * @param {string} name agent name
 */
export function clearQueue(name) {
  return axios.get(`/agents/${name}/clear`)
    .then(({ data }) => data.success)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Task agent to receive file upload.
 */
export function uploadFile(name, base64File, pathToFile) {
  return axios.post(`/agents/${name}/upload`, { filename: pathToFile, data: base64File })
    .then(({ data }) => data.taskID)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Task agent to send file to Empire.
 */
export function downloadFile(name, pathToFile) {
  return axios.post(`/agents/${name}/download`, { filename: pathToFile })
    .then(({ data }) => data.taskID)
    .catch((error) => Promise.reject(error.response.data.error));
}
