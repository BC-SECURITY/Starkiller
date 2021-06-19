import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of malleable profiles.
 */
// eslint-disable-next-line import/prefer-default-export
export function getMalleableProfiles() {
  return axios.get('/malleable-profiles')
    .then(({ data }) => data.profiles)
    .catch((error) => Promise.reject(error.response.data.error));
}
