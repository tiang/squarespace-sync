const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const errorBody = await res.json(); if (errorBody.error) message = errorBody.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}
