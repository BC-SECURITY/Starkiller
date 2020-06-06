// axios 0.19 killed the params in create. Locked at 0.18 for now.
// https://github.com/axios/axios/issues/2190
import axios from 'axios';

// todo: I don't like this cyclic dependency, but struggling to find a better way atm.
import store from '@/store/index';

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

  // if our token is invalid, logout.
  axiosInstance.interceptors.response.use(
    response => response,
    (err) => {
      if (err.response.status === 401) {
        store.dispatch('application/logout');
      }
    },
  );
}
