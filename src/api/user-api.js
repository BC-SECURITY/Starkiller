import { request, handleError } from "@/api/http";

/**
 * Returns a single users.
 */
export function getUser(id) {
  return request(`/users/${id}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

/**
 * Returns a full list of users.
 */
export function getUsers() {
  return request("/users")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Create a user.
 * @param {string} username
 * @param {string} password
 */
export function createUser(user) {
  return request
    .post("/users", user)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Update a user.
 */
export function updateUser(user) {
  return request
    .put(`/users/${user.id}`, user)
    .catch((error) => Promise.reject(handleError(error)));
}

/**
 * Update user's password.
 * @param {string} id user's id
 * @param {boolean} password new password
 */
export function updatePassword(id, password) {
  return request
    .put(`/users/${id}/password`, { password })
    .catch((error) => Promise.reject(handleError(error)));
}

export function uploadAvatar(userId, data) {
  return request.post(`/users/${userId}/avatar`, data);
}
