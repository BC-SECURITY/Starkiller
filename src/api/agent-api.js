import { axiosInstance as axios, handleError } from '@/api/axios-instance';
import qs from 'qs';

/**
 * Returns a single agent.
 */
export function getAgent(sessionId) {
  return axios.get(`/agents/${sessionId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a full list of agents.
 */
export function getAgents(includeArchived = false) {
  return axios.get('/agents', { params: { include_archived: includeArchived } })
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

// or even just id if we remove the numeric ids.
/**
 * Rename an agent.
 */
export function renameAgent(agent, newName) {
  return axios.put(`/agents/${agent.session_id}`, { ...agent, name: newName })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Kill an agent.
 * @param {string} sessionId agent sessionId
 */
export function killAgent(sessionId) {
  console.log('killAgent', sessionId);
  return axios.post(`/agents/${sessionId}/tasks/exit`, {})
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get a single task
 * @param {string} sessionId sessionId name
 */
export function getTask(sessionId, taskId) {
  return axios.get(`/agents/${sessionId}/tasks/${taskId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get tasking results for an agent.
 * @param {string} sessionId agent's session_id. Can also be an array of session_ids.
 */
export function getTasks(sessionId, {
  since = null,
  limit = 50,
  page = 1,
  sortBy = 'id',
  sortOrder = 'desc',
  status = null,
  users = null,
  search = null,
}) {
  const params = {
    since,
    limit,
    page,
    order_by: sortBy,
    order_direction: sortOrder,
    status,
    users,
    query: search,
  };

  if (Array.isArray(sessionId)) {
    params.agents = sessionId;
  }

  let url = '';
  if (sessionId == null || Array.isArray(sessionId)) {
    url = '/agents/tasks';
  } else {
    url = `/agents/${sessionId}/tasks`;
  }

  return axios.get(url, {
    params,
    paramsSerializer: (p) => qs.stringify(p, { arrayFormat: 'repeat', skipNulls: true }),
  })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get directory's files.
 * @param {string} sessionId agent sessionId
 */
export function getDirectory(sessionId, directory) {
  let uri = `/agents/${sessionId}/files/${directory}`;
  if (directory === '/') {
    uri = `/agents/${sessionId}/files/root`;
  }
  return axios.get(uri)
    .then(({ data }) => data.children)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to scrape a directory.
 * @param {string} sessionId agent sessionId
 */
export function scrapeDirectory(sessionId, directory) {
  return axios.post(`/agents/${sessionId}/tasks/directory_list`, { path: directory })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to run a shell command.
 * @param {string} sessionId agent sessionId
 */
export function shell(sessionId, command, literal = false) {
  return axios.post(`/agents/${sessionId}/tasks/shell`, { command, literal })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to run sysinfo.
 * @param {*} sessionId agent sessionId
 */
export function sysinfo(sessionId) {
  return axios.post(`/agents/${sessionId}/tasks/sysinfo`, {})
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a queued task.
 * @param {string} sessionId agent sessionId
 */
export function deleteTask(sessionId, taskId) {
  return axios.delete(`/agents/${sessionId}/tasks/${taskId}`)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to receive file upload.
 */
export function uploadFile(sessionId, fileId, pathToFile) {
  return axios.post(`/agents/${sessionId}/tasks/upload`, { path_to_file: pathToFile, file_id: fileId })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to send file to Empire.
 */
export function downloadFile(sessionId, pathToFile) {
  return axios.post(`/agents/${sessionId}/tasks/download`, { path_to_file: pathToFile })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateComms(sessionId, listener) {
  return axios.post(`/agents/${sessionId}/tasks/update_comms`, { new_listener_id: listener })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateKillDate(sessionId, killDate) {
  return axios.post(`/agents/${sessionId}/tasks/kill_date`, { kill_date: killDate })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateWorkingHours(sessionId, workingHours) {
  return axios.post(`/agents/${sessionId}/tasks/working_hours`, { working_hours: workingHours })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateSleep(sessionId, delay, jitter) {
  return axios.post(`/agents/${sessionId}/tasks/sleep`, { delay, jitter })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
