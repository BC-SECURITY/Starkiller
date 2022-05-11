import { axiosInstance as axios } from '@/api/axios-instance';

/**
 * Returns a full list of keywords.
 */
export function getKeywords() {
  return axios.get('/obfuscation/keywords')
    .then(({ data }) => data.records)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function createKeyword(keyword) {
  return axios.post('/obfuscation/keywords', keyword)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function deleteKeyword(id) {
  return axios.delete(`/obfuscation/keywords/${id}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function getObfuscationConfig(language = 'powershell') {
  return axios.get(`/obfuscation/global/${language}`)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function updateObfuscationConfig(config) {
  return axios.put(`/obfuscation/global/${config.language}`, config)
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function preobfuscateModules(language = 'powershell', reobfuscate = false) {
  return axios.post(`/obfuscation/global/${language}/preobfuscate`, {}, { params: { reobfuscate } })
    .catch((error) => Promise.reject(error.response.data.detail));
}

export function deletePreobfuscatedModules(language = 'powershell') {
  return axios.delete(`/obfuscation/global/${language}/preobfuscate`)
    .catch((error) => Promise.reject(error.response.data.detail));
}
