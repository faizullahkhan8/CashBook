import { config, scopedQuery } from './config';

async function get(path) {
  const response = await fetch(`${config.apiUrl}${path}${path.includes('?') ? '&' : '?'}${scopedQuery}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const body = await response.json();
  return body.data;
}

export const api = {
  dashboard: () => get('/api/v1/dashboard'),
  closings: () => get('/api/v1/closings?limit=100'),
  closing: (id) => get(`/api/v1/closings/${encodeURIComponent(id)}`),
  supplierBills: (query = '') => get(`/api/v1/suppliers/bills${query ? `?${query}` : ''}`),
  supplierDaily: (query = '') => get(`/api/v1/suppliers/daily${query ? `?${query}` : ''}`),
};
