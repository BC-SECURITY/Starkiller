import { axiosInstance as axios, handleError } from "@/api/axios-instance";

/**
 * Returns a single agent.
 */
export function getAgent(sessionId) {
  return axios
    .get(`/agents/${sessionId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a full list of agents.
 */
export function getAgents(includeArchived = false) {
  return axios
    .get("/agents", { params: { include_archived: includeArchived } })
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

// or even just id if we remove the numeric ids.
/**
 * Rename an agent.
 */
export function renameAgent(agent, newName) {
  return axios
    .put(`/agents/${agent.session_id}`, { ...agent, name: newName })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Kill an agent.
 * @param {string} sessionId agent sessionId
 */
export function killAgent(sessionId) {
  return axios
    .post(`/agents/${sessionId}/tasks/exit`, {})
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get directory's files.
 * @param {string} sessionId agent sessionId
 */
export function getDirectory(sessionId, directory) {
  let uri = `/agents/${sessionId}/files/${directory}`;
  if (directory === "/") {
    uri = `/agents/${sessionId}/files/root`;
  }
  return axios
    .get(uri)
    .then(({ data }) => data.children)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to scrape a directory.
 * @param {string} sessionId agent sessionId
 */
export function scrapeDirectory(sessionId, directory) {
  return axios
    .post(`/agents/${sessionId}/tasks/directory_list`, { path: directory })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(agentId, tag) {
  return axios
    .delete(`agents/${agentId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(agentId, tag) {
  return axios
    .put(`agents/${agentId}/tags/${tag.id}`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(agentId, tag) {
  return axios
    .post(`agents/${agentId}/tags`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getProcesses(hostId) {
  return axios
    .get(`/hosts/${hostId}/processes`)
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getCheckinsLast() {
  return axios
    .get("/agents/checkins/", {
      params: {
        limit: 1,
        order_direction: "desc",
      },
    })
    .then(({ data }) => data.records[0])
    .catch((error) => Promise.reject(handleError(error)));
}

export function getCheckinsAgg(
  bucketSize = "day",
  startDate = null,
  endDate = null,
) {
  return axios
    .get("/agents/checkins/aggregate", {
      params: {
        bucket_size: bucketSize.toLowerCase(),
        start_date: startDate,
        end_date: endDate,
      },
    })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
