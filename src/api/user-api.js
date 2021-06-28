import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a single users.
 */
export function getUser(id) {
  return axios.get(`/users/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Returns a full list of users.
 */
export function getUsers() {
  return axios.get('/users')
    .then(({ data }) => data.users)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Create a user.
 * @param {string} username
 * @param {string} password
 */
export function createUser(username, password) {
  return axios.post('/users', { username, password })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Disable/Able a user.
 * @param {string} id user's id
 * @param {boolean} disable whether the user should be disabled or not.
 */
export function disableUser(id, disable) {
  return axios.put(`/users/${id}/disable`, { disable })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}

/**
 * Update user's password.
 * @param {string} id user's id
 * @param {boolean} password new password
 */
export function updatePassword(id, password) {
  return axios.put(`/users/${id}/updatepassword`, { password })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.error));
}
