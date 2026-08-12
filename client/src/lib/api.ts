/**
 * api.ts - Production API Client for Streamly Backend Server
 * Includes silent token-refresh on 401 responses.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export function getStoredToken(): string | null {
  return localStorage.getItem('streamly_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('streamly_token', token);
  } else {
    localStorage.removeItem('streamly_token');
  }
}

// Track in-flight refresh to prevent parallel refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to silently refresh the access token using the httpOnly
 * refreshToken cookie. Returns the new access token, or null on failure.
 */
async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refreshToken cookie
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as { token?: string };
      if (data.token) {
        setStoredToken(data.token);
        return data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core API request function with automatic silent token refresh on 401.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retrying = false
): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // On 401 — attempt silent refresh once, then retry
  if (response.status === 401 && !retrying) {
    const newToken = await attemptTokenRefresh();

    if (newToken) {
      // Retry original request with the refreshed token
      return apiRequest<T>(endpoint, options, true);
    }

    // Refresh failed — clear session and redirect to login
    setStoredToken(null);
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
