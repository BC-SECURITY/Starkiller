import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of bypasses.
 */
// eslint-disable-next-line import/prefer-default-export
export function getBypasses() {
  return axios.get('/bypasses')
    .then(({ data }) => data.bypasses)
    .catch((error) => Promise.reject(error.response.data.error));
}
