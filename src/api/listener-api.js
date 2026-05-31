import { request, handleError } from "@/api/http";

/**
 * Returns a single listener.
 */
export function getListener(id) {
  return request(`/listeners/${id}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Returns a full list of listeners.
 */
export function getListeners() {
  return request("/listeners")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get the options for building a specific type of listener.
 * @param {string} type the type of listener
 */
export function getListenerTemplate(templateId) {
  return request(`/listener-templates/${templateId}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Create a listener.
 * @param {Object} options the options needed for creating a listener.
 */
export function createListener(template, options) {
  return request
    .post("/listeners", { name: options.Name, template, options })
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Update a listener.
 * @param {Object} options the options needed for creating a listener.
 */
export function updateListener(listener) {
  listener.name = listener.options.Name;
  return request
    .put(`/listeners/${listener.id}`, listener)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Get the listener templates as an array of strings.
 */
export function getListenerTemplates() {
  return request("/listener-templates")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Kill a listener by name.
 * @param {string} name name of the listener to kill
 */
export function killListener(name) {
  return request
    .delete(`/listeners/${name}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteTag(listenerId, tag) {
  return request
    .delete(`listeners/${listenerId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(listenerId, tag) {
  return request
    .put(`listeners/${listenerId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(listenerId, tag) {
  return request
    .post(`listeners/${listenerId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getAutorunTasks(listenerId) {
  return request(`/listeners/${listenerId}/autorun`)
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function saveAutorunTasks(listenerId, modules) {
  return request
    .put(`/listeners/${listenerId}/autorun`, { records: modules })
    .catch((error) => Promise.reject(handleError(error)));
}
