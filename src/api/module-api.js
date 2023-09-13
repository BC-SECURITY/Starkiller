import { axiosInstance as axios, handleError } from "@/api/axios-instance";

/**
 * Returns a full list of modules.
 */
export function getModules() {
  return axios
    .get("/modules")
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Executes a module against an agent.
 */
export function executeModule(
  name,
  options,
  ignoreAdminCheck,
  ignoreLanguageCheck,
) {
  return axios
    .post(`/agents/${options.Agent}/tasks/module/`, {
      module_id: name,
      options,
      ignore_admin_check: ignoreAdminCheck,
      ignore_language_version_check: ignoreLanguageCheck,
    })
    .then(({ data }) => ({ agent: options.Agent, ...data }))
    .catch((error) =>
      // eslint-disable-next-line prefer-promise-reject-errors
      Promise.reject({ agent: options.Agent, error: handleError(error) }),
    );
}

export function reloadModules() {
  return axios
    .post("/modules/reload")
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function resetModules() {
  return axios
    .post("/modules/reset")
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}
