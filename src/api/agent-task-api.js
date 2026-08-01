import { request, handleError } from "@/api/http";

/**
 * Get a single task
 * @param {string} sessionId sessionId name
 */
export function getTask(sessionId, taskId) {
  return request(`/agents/${sessionId}/tasks/${taskId}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Get tasking results for an agent.
 * @param {string} sessionId agent's session_id. Can also be an array of session_ids.
 */
export function getTasks(
  sessionId,
  {
    since = null,
    limit = 50,
    page = 1,
    sortBy = "id",
    sortOrder = "desc",
    status = null,
    users = null,
    tags = null,
    search = null,
  },
) {
  const params = {
    since,
    limit,
    page,
    order_by: sortBy,
    order_direction: sortOrder,
    status,
    users,
    tags,
    query: search,
  };

  if (Array.isArray(sessionId)) {
    params.agents = sessionId;
  }

  let url;
  if (sessionId == null || Array.isArray(sessionId)) {
    url = "/agents/tasks";
  } else {
    url = `/agents/${sessionId}/tasks`;
  }

  return request(url, { params }).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Task an agent to run a shell command.
 * @param {string} sessionId agent sessionId
 */
export function shell(sessionId, command, literal = false) {
  return request
    .post(`/agents/${sessionId}/tasks/shell`, { command, literal })
    .catch((error) => Promise.reject(handleError(error)));
}

export function createSocksProxy(sessionId, portNumber) {
  return request
    .post(`/agents/${sessionId}/tasks/socks`, { port: portNumber })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to run sysinfo.
 * @param {*} sessionId agent sessionId
 */
export function sysinfo(sessionId) {
  return request
    .post(`/agents/${sessionId}/tasks/sysinfo`, {})
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a queued task.
 * @param {string} sessionId agent sessionId
 */
export function deleteTask(sessionId, taskId) {
  return request
    .delete(`/agents/${sessionId}/tasks/${taskId}`)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to receive file upload.
 */
export function uploadFile(sessionId, fileId, pathToFile) {
  return request
    .post(`/agents/${sessionId}/tasks/upload`, {
      path_to_file: pathToFile,
      file_id: fileId,
    })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to send file to Empire.
 */
export function downloadFile(sessionId, pathToFile) {
  return request
    .post(`/agents/${sessionId}/tasks/download`, { path_to_file: pathToFile })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateComms(sessionId, listener) {
  return request
    .post(`/agents/${sessionId}/tasks/update_comms`, {
      new_listener_id: listener,
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateKillDate(sessionId, killDate) {
  return request
    .post(`/agents/${sessionId}/tasks/kill_date`, { kill_date: killDate })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateWorkingHours(sessionId, workingHours) {
  return request
    .post(`/agents/${sessionId}/tasks/working_hours`, {
      working_hours: workingHours,
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateSleep(sessionId, delay, jitter) {
  return request
    .post(`/agents/${sessionId}/tasks/sleep`, { delay, jitter })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task the agent to report its background jobs.
 * Returns the created task object; poll with getTask() for actual results.
 * @param {string} sessionId agent sessionId
 */
export function getJobs(sessionId) {
  return request
    .post(`/agents/${sessionId}/tasks/jobs`)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Kill a background job on an agent.
 * @param {string} sessionId agent sessionId
 * @param {number} jobId job ID to kill
 */
export function killJob(sessionId, jobId) {
  return request
    .post(`/agents/${sessionId}/tasks/kill_job`, { id: jobId })
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateProxies(sessionId, proxies) {
  return request
    .post(`/agents/${sessionId}/tasks/proxy_list`, proxies)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(agentId, taskId, tag) {
  return request
    .delete(`agents/${agentId}/tasks/${taskId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(agentId, taskId, tag) {
  return request
    .put(`agents/${agentId}/${taskId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(agentId, taskId, tag) {
  return request
    .post(`agents/${agentId}/tasks/${taskId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function stopTask(agentId, taskId) {
  return request
    .post(`/agents/${agentId}/tasks/stop_job`, { id: taskId })
    .catch((error) => Promise.reject(handleError(error)));
}
