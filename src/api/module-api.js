import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of modules.
 */
export function getModules() {
  return axios.get('/modules')
    .then(({ data }) => data.modules)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Executes a module against an agent.
 * @param {*} name module name
 * @param {*} options module options
 */
export function executeModule(name, options) {
  return axios.post(`/modules/${name}`, options)
    .then(({ data }) => ({ agent: options.Agent, message: data.msg, taskID: data.taskID }))
    // eslint-disable-next-line prefer-promise-reject-errors
    .catch((error) => Promise.reject({ agent: options.Agent, error: error.response.data.error }));
}
