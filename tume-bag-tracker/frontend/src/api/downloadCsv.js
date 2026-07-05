import axiosInstance from './axiosInstance';

/**
 * Download a protected CSV endpoint using axios (Bearer token + cookies).
 */
export async function downloadCsv(endpoint, params = {}, filename = 'export.csv') {
  const response = await axiosInstance.get(endpoint, {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
