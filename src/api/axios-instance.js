import axios from 'axios';
// axios 0.19 killed the params in create. Locked at 0.18 for now.
// https://github.com/axios/axios/issues/2190

// eslint-disable-next-line import/no-mutable-exports
export let axiosInstance = null;

export function setInstance(url, token) {
  axiosInstance = axios.create({
    baseURL: `https://${url}/api`,
    headers: { 'Content-Type': 'application/json' },
    params: {
      token,
    },
  });
}
