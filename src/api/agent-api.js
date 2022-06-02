import { axiosInstance as axios } from '@/api/axios-instance';
import qs from 'qs';

/**
 * Returns a single agent.
 */
export function getAgent(name) {
  return axios.get(`/agents/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Returns a full list of agents.
 */
export function getAgents(includeArchived = false) {
  return axios.get('/agents', { params: { include_archived: includeArchived } })
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

// todo name should be session id on all these endpoints.
// or even just id if we remove the numeric ids.
/**
 * Rename an agent.
 */
export function renameAgent(agent, newName) {
  return axios.put(`/agents/${agent.session_id}`, { ...agent, name: newName })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Kill an agent.
 * @param {string} name agent name
 */
export function killAgent(name) {
  console.log('killAgent', name);
  return axios.post(`/agents/${name}/tasks/exit`, {})
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Remove an agent.
 * @param {string} name agent name
 */
export function removeAgent(name) {
  return axios.delete(`/agents/${name}`)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get a single task
 * @param {string} name agent name
 */
export function getTask(name, taskId) {
  return axios.get(`/agents/${name}/tasks/${taskId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get tasking results for an agent.
 * @param {string} agentId agent's session_id. Can also be an array of session_ids.
 */
export function getTasks(agentId, {
  since = null,
  limit = 50,
  page = 1,
  sortBy = 'id',
  sortOrder = 'desc',
  status = null,
  users = null,
}) {
  const params = {
    since,
    limit,
    page,
    order_by: sortBy,
    order_direction: sortOrder,
    status,
    users,
  };

  if (Array.isArray(agentId)) {
    params.agents = agentId;
  }

  let url = '';
  if (agentId == null || Array.isArray(agentId)) {
    url = '/agents/tasks';
  } else {
    url = `/agents/${agentId}/tasks`;
  }

  return axios.get(url, {
    params,
    paramsSerializer: (p) => qs.stringify(p, { arrayFormat: 'repeat', skipNulls: true }),
  })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Get directory's files.
 * @param {string} name agent name
 */
export function getDirectory(name, directory) {
  let uri = `/agents/${name}/files/${directory}`;
  if (directory === '/') {
    uri = `/agents/${name}/files/root`;
  }
  return axios.get(uri)
    .then(({ data }) => data.children)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Task an agent to scrape a directory.
 * @param {string} name agent name
 */
export function scrapeDirectory(name, directory) {
  return axios.post(`/agents/${name}/tasks/directory_list`, { path: directory })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Task an agent to run a shell command.
 * @param {string} name agent name
 */
export function shell(name, command) {
  return axios.post(`/agents/${name}/tasks/shell`, { command })
    .then(({ data }) => data.taskID)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Delete a queued task.
 * @param {string} name agent name
 */
export function deleteTask(name, taskId) {
  return axios.delete(`/agents/${name}/tasks/${taskId}`)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Task agent to receive file upload.
 */
export function uploadFile(name, fileId, pathToFile) {
  return axios.post(`/agents/${name}/tasks/upload`, { path_to_file: pathToFile, file_id: fileId })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

/**
 * Task agent to send file to Empire.
 */
export function downloadFile(name, pathToFile) {
  return axios.post(`/agents/${name}/tasks/download`, { path_to_file: pathToFile })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function updateComms(name, listener) {
  return axios.post(`/agents/${name}/tasks/update_comms`, { new_listener_id: listener })
    .then(({ data }) => data.success)
    .catch((error) => Promise.reject(error.response.data.error));
}

export function updateKillDate(name, killDate) {
  return axios.post(`/agents/${name}/tasks/kill_date`, { kill_date: killDate })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function updateWorkingHours(name, workingHours) {
  return axios.post(`/agents/${name}/tasks/working_hours`, { working_hours: workingHours })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function updateSleep(name, delay, jitter) {
  return axios.post(`/agents/${name}/tasks/sleep`, { delay, jitter })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}
