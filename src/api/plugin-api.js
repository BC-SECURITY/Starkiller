import { axiosInstance as axios, handleError } from "@/api/axios-instance";
import qs from "qs";

/**
 * Returns a full list of plugins.
 */
export function getPlugins() {
  return axios
    .get("/plugins")
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a plugin by name.
 * This endpoint appears to be broken atm, we just grab the plugin from the list.
 */
export function getPlugin(name) {
  return axios
    .get(`/plugins/${name}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Execute a plugin command.
 */
export function executePlugin(name, options) {
  return axios
    .post(`/plugins/${name}/execute`, { options })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get a single task
 * @param {string} pluginId
 */
export function getTask(pluginId, taskId) {
  return axios
    .get(`/plugins/${pluginId}/tasks/${taskId}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get tasking results for an agent.
 * @param {string} pluginId plugin's id. Can also be an array of ids.
 */
export function getTasks(
  pluginId,
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

  if (Array.isArray(pluginId)) {
    params.plugins = pluginId;
  }

  let url = "";
  if (pluginId == null || Array.isArray(pluginId)) {
    url = "/plugins/tasks";
  } else {
    url = `/plugins/${pluginId}/tasks`;
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
export function reloadPlugins() {
  return axios
    .post("/plugins/reload")
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(pluginId, taskId, tag) {
  return axios
    .delete(`plugins/${pluginId}/tasks/${taskId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(pluginId, taskId, tag) {
  return axios
    .put(`plugins/${pluginId}/${taskId}/tags/${tag.id}`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(pluginId, taskId, tag) {
  return axios
    .post(`plugins/${pluginId}/tasks/${taskId}/tags`, tag)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
