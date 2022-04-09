import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of modules.
 */
export function getModules() {
  return axios.get('/modules')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

// todo move to agent-api.js or create a agent-task-api.js
/**
 * Executes a module against an agent.
 * @param {*} name module name
 * @param {*} options module options
 */
export function executeModule(name, options, ignoreAdminCheck, ignoreLanguageCheck) {
  return axios.post(`/agents/${options.Agent}/tasks/module/`, {
    module_slug: name,
    options,
    ignore_admin_check: ignoreAdminCheck,
    ignore_language_version_check: ignoreLanguageCheck,
  })
    .then(({ data }) => ({ agent: options.Agent, message: data.msg, taskID: data.id }))
    // eslint-disable-next-line prefer-promise-reject-errors
    .catch((error) => Promise.reject({ agent: options.Agent, error: error.response.data.detail }));
}
