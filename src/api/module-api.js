import { request, handleError } from "@/api/http";

/**
 * Returns a full list of modules.
 */
export function getModules() {
  return request("/modules")
    .then((data) => data.records)
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
  backgroundOverride,
) {
  return request
    .post(`/agents/${options.Agent}/tasks/module/`, {
      module_id: name,
      options,
      ignore_admin_check: ignoreAdminCheck,
      ignore_language_version_check: ignoreLanguageCheck,
      background_override: backgroundOverride,
    })
    .then((data) => ({ agent: options.Agent, ...data }))
    .catch((error) =>
      // eslint-disable-next-line prefer-promise-reject-errors
      Promise.reject({ agent: options.Agent, error: handleError(error) }),
    );
}

export function reloadModules() {
  return request
    .post("/modules/reload")
    .catch((error) => Promise.reject(handleError(error)));
}

export function resetModules() {
  return request
    .post("/modules/reset")
    .catch((error) => Promise.reject(handleError(error)));
}
