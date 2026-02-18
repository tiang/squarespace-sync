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
    try { const body = await res.json(); if (body.error) message = body.error; } catch {}
    throw new Error(message);
  }
}
