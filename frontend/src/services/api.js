import { signalSessionExpired, withTimeout } from './session';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Recursively normalize MongoDB responses:
 *  - {"$oid": "abc..."} → "abc..."  (ObjectId canonical JSON)
 *  - Ensures every _id is a plain string
 *  - Adds id alias so both record.id and record._id work
 */
function normalizeMongo(data) {
  if (Array.isArray(data)) return data.map(normalizeMongo);
  if (data !== null && typeof data === 'object') {
    // MongoDB Extended JSON ObjectId: {"$oid": "hex..."}
    if ('$oid' in data) return String(data.$oid);

    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = normalizeMongo(value);
    }

    // Coerce _id to string if it's still an object
    if (result._id !== undefined && result._id !== null && typeof result._id !== 'string') {
      result._id = String(result._id);
    }

    // Bidirectional aliasing: ensure both _id and id always exist
    if (result._id && !result.id) {
      result.id = result._id;
    }
    if (result.id && !result._id) {
      result._id = typeof result.id === 'string' ? result.id : String(result.id);
    }

    return result;
  }
  return data;
}

async function authHeader() {
  try {
    const { auth } = await import('../config/firebase');
    // getIdToken() transparently refreshes an expired (1h) Firebase token.
    if (auth.currentUser) return `Bearer ${await auth.currentUser.getIdToken()}`;
  } catch {
    // Firebase not initialised — fall through to stored tokens.
  }
  const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
  return token ? `Bearer ${token}` : null;
}

/** Turns a Laravel error body into one readable sentence. */
function errorMessage(body, status) {
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat()[0];
    if (first) return first;
  }
  if (body?.error) return body.error;
  if (body?.message) return body.message;
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again shortly.';
  return `Request failed (${status}).`;
}

async function request(endpoint, options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const authorization = await authHeader();
  if (authorization) headers.Authorization = authorization;

  // Role hint for the backend's local MOCK_AUTH mode only — never sent in production.
  if (import.meta.env.DEV) {
    try {
      const role = JSON.parse(localStorage.getItem('lexium_user') || 'null')?.role;
      if (role) headers['X-Mock-Role'] = role;
    } catch {
      // Ignore a corrupt stored user.
    }
  }

  const { init, clear } = withTimeout({ ...options, headers });
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, init);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.', { cause: err });
    throw new Error('Could not reach the server. Check your connection and try again.', { cause: err });
  } finally {
    clear();
  }

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (response.status === 401 && authorization) signalSessionExpired();
    const error = new Error(errorMessage(body, response.status));
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return normalizeMongo(body);
}

export const api = {
  get:    (endpoint)       => request(endpoint, { method: 'GET' }),
  post:   (endpoint, data) => request(endpoint, { method: 'POST',   body: JSON.stringify(data ?? {}) }),
  put:    (endpoint, data) => request(endpoint, { method: 'PUT',    body: JSON.stringify(data ?? {}) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};

export default api;
