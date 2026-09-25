import { signalSessionExpired, withTimeout } from './session';

export const ADMIN_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Drop-in replacement for fetch() on admin endpoints: same arguments, same
 * Response back. Adds the admin bearer token and ends the session when the
 * server reports it expired (401).
 */
export async function adminFetch(url, init = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = { Accept: 'application/json', ...(init.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const { init: timed, clear } = withTimeout({ ...init, headers });
  try {
    const res = await fetch(url, timed);
    if (res.status === 401) signalSessionExpired();
    return res;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.', { cause: err });
    throw err;
  } finally {
    clear();
  }
}
