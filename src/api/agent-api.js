import { request, handleError } from "@/api/http";

/**
 * Returns a single agent.
 */
export function getAgent(sessionId) {
  return request(`/agents/${sessionId}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Returns a full list of agents.
 */
export function getAgents(includeArchived = false) {
  return request("/agents", { params: { include_archived: includeArchived } })
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

// or even just id if we remove the numeric ids.
/**
 * Rename an agent.
 */
export function renameAgent(agent, newName) {
  return request
    .put(`/agents/${agent.session_id}`, { ...agent, name: newName })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Kill an agent.
 * @param {string} sessionId agent sessionId
 */
export function killAgent(sessionId) {
  return request
    .post(`/agents/${sessionId}/tasks/exit`, {})
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
  return request(uri)
    .then((data) => data.children)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Task an agent to scrape a directory.
 * @param {string} sessionId agent sessionId
 */
export function scrapeDirectory(sessionId, directory) {
  return request
    .post(`/agents/${sessionId}/tasks/directory_list`, { path: directory })
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(agentId, tag) {
  return request
    .delete(`agents/${agentId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(agentId, tag) {
  return request
    .put(`agents/${agentId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(agentId, tag) {
  return request
    .post(`agents/${agentId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}
