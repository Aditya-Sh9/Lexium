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

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Attach Firebase token or fallback to stored token
  try {
    const { auth } = await import('../config/firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const localToken = localStorage.getItem('auth_token');
      if (localToken) config.headers.Authorization = `Bearer ${localToken}`;
    }
  } catch {
    const localToken = localStorage.getItem('auth_token');
    if (localToken) config.headers.Authorization = `Bearer ${localToken}`;
  }

  // Send role header for mock-auth dev mode
  const userStr = localStorage.getItem('user') || localStorage.getItem('lexium_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) config.headers['X-Mock-Role'] = user.role;
    } catch {}
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `API Error: ${response.status}`);
  }

  const json = await response.json();
  return normalizeMongo(json);
}

export const api = {
  get:    (endpoint)       => request(endpoint, { method: 'GET' }),
  post:   (endpoint, data) => request(endpoint, { method: 'POST',   body: JSON.stringify(data) }),
  put:    (endpoint, data) => request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};

export default api;
