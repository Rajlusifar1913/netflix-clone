/**
 * api.ts - Production API Client for Streamly Backend Server
 *
 * SEC-1 FIX: JWT access tokens are NO LONGER stored in localStorage.
 * Doing so exposed them to XSS attacks — any injected script could steal the token.
 *
 * The server sets an httpOnly cookie (`token`) on every login/register response.
 * All requests use `credentials: 'include'` so the browser automatically attaches
 * that cookie. The server's auth middleware reads from the cookie as primary source.
 *
 * We keep a lightweight non-sensitive `streamly_has_session` boolean in localStorage
 * only as a hint to decide whether to attempt /auth/me on page load.
 * This flag contains NO secrets and losing it just means an extra /me call.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ── Session indicator (non-sensitive boolean hint, NOT a token) ─────────────
const SESSION_FLAG_KEY = 'streamly_has_session';

export function hasSession(): boolean {
  return localStorage.getItem(SESSION_FLAG_KEY) === 'true';
}

export function setSessionFlag(active: boolean): void {
  if (active) {
    localStorage.setItem(SESSION_FLAG_KEY, 'true');
  } else {
    localStorage.removeItem(SESSION_FLAG_KEY);
  }
}

// Track in-flight refresh to prevent parallel refresh calls
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to silently refresh the access token using the httpOnly
 * refreshToken cookie. Returns true if refresh succeeded.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refreshToken cookie
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setSessionFlag(false);
        return false;
      }

      // Refresh succeeded — the server has set a new httpOnly access token cookie
      setSessionFlag(true);
      return true;
    } catch {
      setSessionFlag(false);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core API request function with automatic silent token refresh on 401.
 * Relies entirely on httpOnly cookies — no Authorization header needed.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retrying = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // SEC-1: No Authorization header — the httpOnly cookie is sent automatically
  // by the browser when credentials: 'include' is set.
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // On 401 — attempt silent refresh once, then retry
  if (response.status === 401 && !retrying) {
    const refreshed = await attemptTokenRefresh();

    if (refreshed) {
      return apiRequest<T>(endpoint, options, true);
    }

    // Refresh failed — clear session flag and redirect to login
    setSessionFlag(false);
    sessionStorage.removeItem('streamly_session');
    window.dispatchEvent(new Event('streamly:session-change'));
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  const data = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }

  return data as T;
}
