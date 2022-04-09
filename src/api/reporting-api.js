import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of reporting events for agents.
 */
// eslint-disable-next-line import/prefer-default-export
export function getReporting() {
  return axios.get('/agents/tasks')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}
