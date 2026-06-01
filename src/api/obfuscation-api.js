import { request, handleError } from "@/api/http";

/**
 * Returns a full list of keywords.
 */
export function getKeywords() {
  return request("/obfuscation/keywords")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function createKeyword(keyword) {
  return request
    .post("/obfuscation/keywords", keyword)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateKeyword(keyword) {
  return request
    .put(`/obfuscation/keywords/${keyword.id}`, keyword)
    .catch((error) => Promise.reject(handleError(error)));
}

export function deleteKeyword(id) {
  return request
    .delete(`/obfuscation/keywords/${id}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getObfuscationConfigs() {
  return request("/obfuscation/global")
    .then((data) => data.records)
    .catch((error) => Promise.reject(handleError(error)));
}

export function getObfuscationConfig(language = "powershell") {
  return request(`/obfuscation/global/${language}`).catch((error) =>
    Promise.reject(handleError(error)),
  );
}

export function updateObfuscationConfig(config) {
  return request
    .put(`/obfuscation/global/${config.language}`, config)
    .catch((error) => Promise.reject(handleError(error)));
}

export function preobfuscateModules(
  language = "powershell",
  reobfuscate = false,
) {
  return request
    .post(
      `/obfuscation/global/${language}/preobfuscate`,
      {},
      {
        params: { reobfuscate },
      },
    )
    .catch((error) => Promise.reject(handleError(error)));
}

export function deletePreobfuscatedModules(language = "powershell") {
  return request
    .delete(`/obfuscation/global/${language}/preobfuscate`)
    .catch((error) => Promise.reject(handleError(error)));
}
