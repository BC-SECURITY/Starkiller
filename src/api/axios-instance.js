import axios from "axios";
import { useApplicationStore } from "@/stores/application-module";

// eslint-disable-next-line import/no-mutable-exports
export let axiosInstance = null;

export function setInstance(url, token) {
  axiosInstance = axios.create({
    baseURL: `${url}/api/v2`,
    headers: {
      "Content-Type": "application/json",
      "X-Empire-Token": `Bearer ${token}`,
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

// Error carrying the FastAPI `detail` message while preserving the original
// axios response so callers can still introspect err.response.status (e.g.
// AgentStats's 404-terminal branch). toString() returns the bare message — no
// "Error:" prefix — so existing `${err}` interpolations render exactly as they
// did when handleError returned a bare detail string.
class ApiError extends Error {
  toString() {
    return this.message;
  }
}

export function handleError(error) {
  console.error(error);
  const detail = error?.response?.data?.detail;
  if (detail) {
    const apiError = new ApiError(detail);
    apiError.response = error.response;
    return apiError;
  }
  return error;
}
