/**
 * Cross-cutting session signals shared by the API clients and AuthContext.
 * Kept free of React so plain service modules can import it.
 */
export const SESSION_EXPIRED_EVENT = 'lexium:session-expired';

/** Tell the app the server rejected our credentials (expired / revoked). */
export function signalSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/** Aborts a request that hasn't answered within `ms` (Render free tier can cold-start slowly). */
export function withTimeout(init = {}, ms = 30000) {
  if (init.signal) return { init, clear: () => {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { init: { ...init, signal: controller.signal }, clear: () => clearTimeout(timer) };
}
