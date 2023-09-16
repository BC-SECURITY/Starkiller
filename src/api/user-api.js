import { axiosInstance as axios, handleError } from "@/api/axios-instance";

/**
 * Returns a single users.
 */
export function getUser(id) {
  return axios
    .get(`/users/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Returns a full list of users.
 */
export function getUsers() {
  return axios
    .get("/users")
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Create a user.
 * @param {string} username
 * @param {string} password
 */
export function createUser(user) {
  return axios
    .post("/users", user)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Update a user.
 */
export function updateUser(user) {
  return axios
    .put(`/users/${user.id}`, user)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Update user's password.
 * @param {string} id user's id
 * @param {boolean} password new password
 */
export function updatePassword(id, password) {
  return axios
    .put(`/users/${id}/password`, { password })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function uploadAvatar(userId, data) {
  return axios({
    method: "post",
    url: `/users/${userId}/avatar`,
    data,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
