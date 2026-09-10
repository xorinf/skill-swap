// Tiny fetch wrapper with cookie-based auth + 401 handling.
import { useMemo } from 'react';
import { useAuth } from '../state/AuthContext.jsx';

const BASE = import.meta.env.VITE_API_URL || '/api';

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

async function request(method, path, { body, headers, signal } = {}) {
  const r = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  let data = null;
  const ct = r.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await r.json();
  if (!r.ok) {
    if (r.status === 401 && _onUnauthorized) _onUnauthorized();
    const err = new Error((data && data.error && data.error.message) || `HTTP ${r.status}`);
    err.status = r.status;
    err.details = data && data.error && data.error.details;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, opts) => request('GET', p, opts),
  post: (p, body, opts) => request('POST', p, { ...opts, body }),
  put: (p, body, opts) => request('PUT', p, { ...opts, body }),
  del: (p, opts) => request('DELETE', p, opts)
};

// Auth hook injects Bearer token if available
export function useApi() {
  const { token } = useAuth();
  // ponytail: memoize so consumers' useEffect([api]) doesn't refire every render.
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  return useMemo(
    () => ({
      get: (p, opts) => request('GET', p, { ...opts, headers: { ...(opts?.headers || {}), ...authHeader } }),
      post: (p, body, opts) => request('POST', p, { ...opts, body, headers: { ...(opts?.headers || {}), ...authHeader } }),
      put: (p, body, opts) => request('PUT', p, { ...opts, body, headers: { ...(opts?.headers || {}), ...authHeader } }),
      del: (p, opts) => request('DELETE', p, { ...opts, headers: { ...(opts?.headers || {}), ...authHeader } })
    }),
    [token]
  );
}
