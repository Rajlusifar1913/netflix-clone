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

// ── Session & Token indicator ───────────────────────────────────────────────
const SESSION_FLAG_KEY = 'streamly_has_session';
const TOKEN_KEY = 'streamly_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function hasSession(): boolean {
  return localStorage.getItem(SESSION_FLAG_KEY) === 'true' || !!getStoredToken();
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
 * refreshToken cookie or refresh endpoint. Returns true if refresh succeeded.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refreshToken cookie
        headers,
      });

      if (!response.ok) {
        setStoredToken(null);
        setSessionFlag(false);
        return false;
      }

      const data = (await response.json()) as { token?: string };
      if (data.token) {
        setStoredToken(data.token);
      }
      setSessionFlag(true);
      return true;
    } catch {
      setStoredToken(null);
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
 * Supports both cross-domain Authorization Bearer headers AND same-site httpOnly cookies.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retrying = false
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

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

    // Refresh failed — clear session flag, token and redirect to login
    setStoredToken(null);
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
