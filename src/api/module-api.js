import { axiosInstance as axios, handleError } from '@/api/axios-instance';

/**
 * Returns a full list of modules.
 */
export function getModules() {
  return axios.get('/modules')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Executes a module against an agent.
 */
export function executeModule(name, options, ignoreAdminCheck, ignoreLanguageCheck) {
  return axios.post(`/agents/${options.Agent}/tasks/module/`, {
    module_id: name,
    options,
    ignore_admin_check: ignoreAdminCheck,
    ignore_language_version_check: ignoreLanguageCheck,
  })
    .then(({ data }) => ({ agent: options.Agent, ...data }))
    // eslint-disable-next-line prefer-promise-reject-errors
    .catch((error) => Promise.reject({ agent: options.Agent, error: handleError(error) }));
}
