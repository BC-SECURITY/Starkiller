import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of credentials.
 */
export function getCredentials() {
  return axios.get('/creds')
    .then(({ data }) => data.creds)
    .catch(error => Promise.reject(error.response.data.error));
}

/**
 * Create a credential.
 */
export function createCredential(options) {
  return axios.post('/creds', options)
    .then(({ data }) => {
      if (data.error) return Promise.reject(data.error);
      return data;
    })
    .catch(error => Promise.reject(error.response ? error.response.data.error : error));
}
