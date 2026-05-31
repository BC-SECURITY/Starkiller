import { useApplicationStore } from "@/stores/application-module";

let config = { baseURL: "", token: "" };

export function setInstance(url, token) {
  config = { baseURL: `${url}/api/v2`, token };
}

// Replaces qs: repeat-array format + skipNulls. URLSearchParams encodes spaces
// as "+"; qs (RFC3986) uses "%20" — normalize so the wire bytes are identical.
function toQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined) sp.append(key, item);
      });
    } else {
      sp.append(key, value);
    }
  });
  const s = sp.toString().replace(/\+/g, "%20");
  return s ? `?${s}` : "";
}

// Empty body => undefined (covers 204 DELETEs). Non-empty body that fails to
// parse as JSON throws an axios-shaped error so a reverse-proxy 200-HTML page
// or a truncated response surfaces immediately instead of crashing a caller's
// `.then(d => d.records)` with an opaque TypeError.
async function safeParse(res, responseType) {
  if (responseType === "blob") return res;
  if (responseType === "text") return res.text();
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error(`Malformed JSON in ${res.status} response`);
    err.response = {
      status: res.status,
      statusText: res.statusText,
      data: text,
    };
    throw err;
  }
}

export async function request(
  path,
  { method = "GET", params, data, headers, responseType = "json" } = {},
) {
  if (!config.baseURL) {
    throw new Error("http.js: setInstance() must be called before request()");
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${config.baseURL}${p}${toQuery(params)}`;
  const isForm = data instanceof FormData;
  const finalHeaders = {
    "X-Empire-Token": `Bearer ${config.token}`,
    ...(headers ?? {}),
  };
  // Never set Content-Type for FormData — the browser sets the multipart boundary.
  if (data != null && !isForm)
    finalHeaders["Content-Type"] = "application/json";

  let body;
  if (data == null) {
    body = undefined;
  } else if (isForm) {
    body = data;
  } else {
    body = JSON.stringify(data);
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
    });
  } catch (networkErr) {
    // No response object => network failure (matches the old interceptor's !err.response).
    useApplicationStore().connectionError += 1;
    throw networkErr;
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      useApplicationStore().logout();
    // safeParse handles its own parse failures; if the error body is malformed
    // we still want to surface the status, so swallow safeParse's throw here
    // and fall through to the synthetic error below with data=undefined.
    let errBody;
    try {
      errBody = await safeParse(res, "json");
    } catch {
      errBody = undefined;
    }
    // axios-compatible shape so handleError, extractErrorMessage, and direct
    // `err.response.data.detail` readers (ListenerEdit.vue) keep working unchanged.
    const err = new Error(`HTTP ${res.status}`);
    err.response = {
      status: res.status,
      statusText: res.statusText,
      data: errBody,
    };
    throw err;
  }

  return safeParse(res, responseType);
}

request.get = (path, opts) => request(path, { ...opts, method: "GET" });
request.post = (path, data, opts) =>
  request(path, { ...opts, method: "POST", data });
request.put = (path, data, opts) =>
  request(path, { ...opts, method: "PUT", data });
request.delete = (path, opts) => request(path, { ...opts, method: "DELETE" });

// Synchronous — same axios-shaped lookup as the old handleError.
export function handleError(error) {
  console.error(error);
  return error?.response?.data?.detail || error;
}
