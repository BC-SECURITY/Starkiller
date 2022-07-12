import { axiosInstance as axios, handleError } from '@/api/axios-instance';
import qs from 'qs';

export function getDownloads({
  page, limit, sortBy = 'updated_at', sortOrder = 'desc', query, sources,
}) {
  return axios.get('/downloads', {
    params: {
      page,
      limit,
      query,
      sources,
      order_by: sortBy,
      order_direction: sortOrder,
    },
    paramsSerializer: (p) => qs.stringify(p, { arrayFormat: 'repeat', skipNulls: true }),
  })
    .then((response) => response.data)
    .catch((error) => Promise.reject(handleError(error)));
}

export function createDownload(data) {
  return axios({
    method: 'post',
    url: '/downloads',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getDownload(id) {
  return axios.get(`/downloads/${id}/download`, { responseType: 'blob' })
    .then((response) => {
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = response.headers['content-disposition'].split('filename=')[1];
      // strip quotes from filename
      filename = filename.replace(/^["']|["']$/g, '');
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function getDownloadAsUrl(id) {
  return axios.get(`/downloads/${id}/download`, { responseType: 'blob' })
    .then((response) => {
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      return url;
    })
    .catch((error) => Promise.reject(handleError(error)));
}

export function getDownloadAsText(id) {
  return axios.get(`/downloads/${id}/download`, { responseType: 'text' })
    .then((response) => response.data)
    .catch((error) => Promise.reject(handleError(error)));
}
