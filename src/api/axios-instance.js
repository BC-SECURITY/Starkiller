import axios from 'axios';

// I don't like this cyclic dependency, but struggling to find a better way atm.
import store from '@/store/index';

// eslint-disable-next-line import/no-mutable-exports
export let axiosInstance = null;

export function setInstance(url, token) {
  axiosInstance = axios.create({
    baseURL: `${url}/api/v2`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });

  // if our token is invalid, logout.
  axiosInstance.interceptors.response.use(
    (response) => response,
    (err) => {
      if (!err?.response) {
        store.dispatch('application/connectionError');
      }

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        store.dispatch('application/logout');
      }
      return Promise.reject(err);
    },
  );
}

export function handleError(error) {
  return error?.response?.data?.detail || error;
}
