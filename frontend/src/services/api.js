/**
 * Base API helper — ready for Laravel backend integration.
 *
 * For now, all service functions use local mock data.
 * When the Laravel backend is ready, simply update BASE_URL
 * and switch service functions to use these fetch helpers.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Try to get real Firebase token
  try {
    const { auth } = await import('../config/firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Fallback
      const localToken = localStorage.getItem('auth_token');
      if (localToken) config.headers.Authorization = `Bearer ${localToken}`;
    }
  } catch (e) {
    const localToken = localStorage.getItem('auth_token');
    if (localToken) config.headers.Authorization = `Bearer ${localToken}`;
  }
  
  const userStr = localStorage.getItem('user') || localStorage.getItem('lexium_user');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) {
        config.headers['X-Mock-Role'] = user.role;
      }
    } catch(e) {}
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
