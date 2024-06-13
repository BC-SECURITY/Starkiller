import { axiosInstance as axios, handleError } from "@/api/axios-instance";
import qs from "qs";

/**
 * Get a single task
 * @param {string} sessionId sessionId name
 */
export function getTask(sessionId, taskId) {
  return axios
    .get(`/agents/${sessionId}/tasks/${taskId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
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

  let url = "";
  if (sessionId == null || Array.isArray(sessionId)) {
    url = "/agents/tasks";
  } else {
    url = `/agents/${sessionId}/tasks`;
  }

  return axios
    .get(url, {
      params,
      paramsSerializer: (p) =>
        qs.stringify(p, { arrayFormat: "repeat", skipNulls: true }),
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to run a shell command.
 * @param {string} sessionId agent sessionId
 */
export function shell(sessionId, command, literal = false) {
  return axios
    .post(`/agents/${sessionId}/tasks/shell`, { command, literal })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function createSocksProxy(sessionId, portNumber) {
  return axios
    .post(`/agents/${sessionId}/tasks/socks`, {
      port: portNumber,
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to run sysinfo.
 * @param {*} sessionId agent sessionId
 */
export function sysinfo(sessionId) {
  return axios
    .post(`/agents/${sessionId}/tasks/sysinfo`, {})
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Delete a queued task.
 * @param {string} sessionId agent sessionId
 */
export function deleteTask(sessionId, taskId) {
  return axios
    .delete(`/agents/${sessionId}/tasks/${taskId}`)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to receive file upload.
 */
export function uploadFile(sessionId, fileId, pathToFile) {
  return axios
    .post(`/agents/${sessionId}/tasks/upload`, {
      path_to_file: pathToFile,
      file_id: fileId,
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task agent to send file to Empire.
 */
export function downloadFile(sessionId, pathToFile) {
  return axios
    .post(`/agents/${sessionId}/tasks/download`, { path_to_file: pathToFile })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateComms(sessionId, listener) {
  return axios
    .post(`/agents/${sessionId}/tasks/update_comms`, {
      new_listener_id: listener,
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateKillDate(sessionId, killDate) {
  return axios
    .post(`/agents/${sessionId}/tasks/kill_date`, { kill_date: killDate })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateWorkingHours(sessionId, workingHours) {
  return axios
    .post(`/agents/${sessionId}/tasks/working_hours`, {
      working_hours: workingHours,
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateSleep(sessionId, delay, jitter) {
  return axios
    .post(`/agents/${sessionId}/tasks/sleep`, { delay, jitter })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function scriptImport(sessionId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return axios({
    method: "post",
    url: `/agents/${sessionId}/tasks/script_import`,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => response.data)
    .catch((error) => Promise.reject(handleError(error)));
}
export function getJobs(sessionId) {
  return axios
    .post(`/agents/${sessionId}/tasks/jobs`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function scriptCommand(sessionId, command) {
  return axios
    .post(`/agents/${sessionId}/tasks/script_command`, { command })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateProxies(sessionId, proxies) {
  return axios
    .post(`/agents/${sessionId}/tasks/proxy_list`, proxies)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(agentId, taskId, tag) {
  return axios
    .delete(`agents/${agentId}/tasks/${taskId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(agentId, taskId, tag) {
  return axios
    .put(`agents/${agentId}/${taskId}/tags/${tag.id}`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(agentId, taskId, tag) {
  return axios
    .post(`agents/${agentId}/tasks/${taskId}/tags`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
