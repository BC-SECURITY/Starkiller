import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of reporting events for agents.
 */
// eslint-disable-next-line import/prefer-default-export
export function getReporting() {
  return axios.get('/reporting')
    .then(({ data }) => data.reporting)
    .catch((error) => Promise.reject(error.response.data.error));
}
