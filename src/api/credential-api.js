import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of credentials.
 */
// eslint-disable-next-line import/prefer-default-export
export function getCredentials() {
  return axios.get('/creds')
    .then(({ data }) => data.creds)
    .catch(error => Promise.reject(error.response.data.error));
}
