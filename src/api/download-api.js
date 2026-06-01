import { request, handleError } from "@/api/http";

function getFilename(contentDisposition) {
  if (!contentDisposition) return "download";
  // need to handle filename="filename.jpg" and filename*=UTF-8''filename.jpg
  if (contentDisposition.indexOf("filename*=") !== -1) {
    return decodeURIComponent(
      contentDisposition.split("filename*=")[1].split("'")[2],
    );
  }

  let filename = contentDisposition.split("filename=")[1];
  filename = filename.replace(/^["']|["']$/g, "");

  return filename;
}

// Inlines the former createObjectURL -> anchor click -> cleanup side effect.
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL so repeated downloads don't leak memory.
  window.URL.revokeObjectURL(url);
}

export function getDownloads({
  page,
  limit,
  sortBy = "updated_at",
  sortOrder = "desc",
  query,
  sources,
  tags,
}) {
  return request("/downloads", {
    params: {
      page,
      limit,
      query,
      sources,
      tags,
      order_by: sortBy,
      order_direction: sortOrder,
    },
  }).catch((error) => Promise.reject(handleError(error)));
}

export function createDownload(data) {
  return request.post("/downloads", data);
}

export function getDownload(id) {
  return request(`/downloads/${id}/download`, {
    responseType: "blob",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
    .then(async (res) => {
      const blob = new Blob([await res.blob()], {
        type: res.headers.get("content-type"),
      });
      triggerDownload(
        blob,
        getFilename(res.headers.get("content-disposition")),
      );
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function getDownloadAsUrl(id) {
  return request(`/downloads/${id}/download`, { responseType: "blob" })
    .then(async (res) => {
      const blob = new Blob([await res.blob()], {
        type: res.headers.get("content-type"),
      });
      return window.URL.createObjectURL(blob);
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function getDownloadAsText(id) {
  return request(`/downloads/${id}/download`, { responseType: "text" }).catch(
    (error) => Promise.reject(handleError(error)),
  );
}

export function deleteTag(downloadId, tag) {
  return request
    .delete(`downloads/${downloadId}/tags/${tag}`)
    .catch((error) => Promise.reject(handleError(error)));
}

export function updateTag(downloadId, tag) {
  return request
    .put(`downloads/${downloadId}/tags/${tag.id}`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}

export function addTag(downloadId, tag) {
  return request
    .post(`downloads/${downloadId}/tags`, tag)
    .catch((error) => Promise.reject(handleError(error)));
}
