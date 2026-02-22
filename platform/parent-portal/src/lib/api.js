const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Set by AuthProvider after Firebase auth state changes.
// Firebase's getIdToken() auto-refreshes expired tokens.
let _currentUser = null;

export function setCurrentUser(user) {
  _currentUser = user;
}

// Called by AuthProvider to trigger redirect on FAMILY_NOT_FOUND 403.
let _onFamilyNotFound = null;

export function setFamilyNotFoundCallback(fn) {
  _onFamilyNotFound = fn;
}

async function authHeaders() {
  if (!_currentUser) return {};
  const token = await _currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function handle403(res) {
  const body = await res.json().catch(() => ({}));
  if (body.code === 'FAMILY_NOT_FOUND' && _onFamilyNotFound) {
    _onFamilyNotFound();
  }
  const err = new Error('Forbidden');
  err.code = body.code;
  throw err;
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: await authHeaders(),
  });
  if (res.status === 403) return handle403(res);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 403) return handle403(res);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// No auth header — used for public endpoints (e.g. pending-registration).
// If authenticated POST routes are added in future, use authHeaders() here too.
export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
