import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single agent.
 */
export function getAgent(name) { // api should throw 404 if not found. COME ON!
  return axios.get(`/agents/${name}`)
    .then(({ data }) => data.agents[0])
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Returns a full list of agents.
 */
export function getAgents() {
  return axios.get('/agents')
    .then(({ data }) => data.agents)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Rename an agent.
 * @param {string} oldName
 * @param {string} newName
 */
export function renameAgent(oldName, newName) {
  return axios.post(`/agents/${oldName}/rename`, { newname: newName })
    .then(({ data }) => data.success)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Kill an agent.
 * @param {string} name agent name
 */
export function killAgent(name) {
  return axios.post(`/agents/${name}/kill`)
    .then(({ data }) => data.success)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Remove an agent.
 * @param {string} name agent name
 */
export function removeAgent(name) {
  return axios.delete(`/agents/${name}`)
    .then(({ data }) => data.success)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Get tasking results for an agent.
 * @param {string} name agent name
 */
export function getResults(name) {
  return axios.get(`/agents/${name}/results`)
    .then(({ data }) => data.results)
    .catch(error => Promise.reject(error.response.data.error));
}


/**
 * Task an agent to run a shell command.
 * @param {string} name agent name
 */
export function shell(name, command) {
  return axios.post(`/agents/${name}/shell`, { command })
    .then(({ data }) => data.taskID)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Clear the queued tasks for an agent.
 * @param {string} name agent name
 */
export function clearQueue(name) {
  return axios.get(`/agents/${name}/clear`)
    .then(({ data }) => data.success)
    .catch(error => Promise.reject(error.response.data.error));
}
