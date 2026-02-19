import { get, post, patch, del } from './api';

export function listStaff({ role, search, includeInactive } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (search) params.set('search', search);
  if (includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  return get(`/api/v1/staff${qs ? `?${qs}` : ''}`).then(r => r.staff);
}

export function createStaff(data) {
  return post('/api/v1/staff', data);
}

export function updateStaff(id, data) {
  return patch(`/api/v1/staff/${id}`, data);
}

export function deactivateStaff(id) {
  return del(`/api/v1/staff/${id}`);
}
