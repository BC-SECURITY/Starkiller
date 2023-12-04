import axios from "axios";
import { useApplicationStore } from "@/stores/application-module";

// eslint-disable-next-line import/no-mutable-exports
export let axiosInstance = null;

export function setInstance(url, token) {
  axiosInstance = axios.create({
    baseURL: `${url}/api/v2`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // if our token is invalid, logout.
  axiosInstance.interceptors.response.use(
    (response) => response,
    (err) => {
      if (!err?.response) {
        useApplicationStore().connectionError += 1;
      }

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        useApplicationStore().logout();
      }

      return Promise.reject(err);
    },
  );
}

export function handleError(error) {
  console.error(error);
  return error?.response?.data?.detail || error;
}
