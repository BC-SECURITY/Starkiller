import { request, handleError } from "@/api/http";

export function getMarketplace() {
  return request("/plugin-registries/marketplace").catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Returns a full list of plugins.
 */
export function getPlugins() {
  return request("/plugins")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a plugin by name.
 * This endpoint appears to be broken atm, we just grab the plugin from the list.
 */
export function getPlugin(name) {
  return request(`/plugins/${name}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

export function updatePlugin(plugin) {
  return request
    .put(`/plugins/${plugin.id}`, plugin)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updatePluginSettings(pluginId, settings) {
  return request
    .put(`/plugins/${pluginId}/settings`, settings)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Execute a plugin command.
 */
export function executePlugin(name, options) {
  return request
    .post(`/plugins/${name}/execute`, { options })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get a single task
 * @param {string} pluginId
 */
export function getTask(pluginId, taskId) {
  return request(`/plugins/${pluginId}/tasks/${taskId}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
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

  let url;
  if (pluginId == null || Array.isArray(pluginId)) {
    url = "/plugins/tasks";
  } else {
    url = `/plugins/${pluginId}/tasks`;
  }

  return request(url, { params }).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

export function reloadPlugins() {
  return request
    .post("/plugins/reload")
    .catch((error) => Promise.reject(handleError(error)));
}

export function installPlugin({ name, version, registry }) {
  return request
    .post(`/plugin-registries/marketplace/install`, {
      name,
      version,
      registry,
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(pluginId, taskId, tag) {
  return request
    .delete(`plugins/${pluginId}/tasks/${taskId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(pluginId, taskId, tag) {
  return request
    .put(`plugins/${pluginId}/${taskId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(pluginId, taskId, tag) {
  return request
    .post(`plugins/${pluginId}/tasks/${taskId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}
