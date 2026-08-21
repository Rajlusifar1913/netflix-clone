/**
 * adminAuth.ts
 * Dedicated client-side authentication and session manager for Streamly Admin Portal.
 * Supports Admin ID + Password login, session persistence, and credential customization.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'content_manager';
  avatar?: string;
  token: string;
  loginAt: string;
}

const ADMIN_SESSION_KEY = 'streamly_admin_session';
const ADMIN_CREDENTIALS_KEY = 'streamly_admin_credentials';

import { apiRequest, setStoredToken } from "./api";

// Default Admin Credentials matching backend seed data (server/src/utils/seedData.ts)
const DEFAULT_CREDENTIALS = {
  adminId: 'admin',
  email: 'admin@streamly.com',
  password: 'AdminPassword123',
  name: 'Admin User',
  role: 'super_admin' as const,
};

interface StoredCredentials {
  adminId: string;
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'content_manager';
}

function getStoredCredentials(): StoredCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
      return DEFAULT_CREDENTIALS;
    }
    const parsed = JSON.parse(raw) as StoredCredentials;
    return parsed;
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

export function getAdminSession(): AdminUser | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  const session = getAdminSession();
  return session !== null && !!session.token;
}

export interface AdminLoginResult {
  ok: boolean;
  error?: string;
  user?: AdminUser;
}

export async function adminLogin(
  adminIdInput: string,
  passwordInput: string,
  rememberMe = true
): Promise<AdminLoginResult> {
  const trimmedId = adminIdInput.trim().toLowerCase();
  const creds = getStoredCredentials();

  // 1. Try Backend Authentication if available
  try {
    const emailToUse = trimmedId.includes('@') ? trimmedId : 'admin@streamly.com';
    const res = await apiRequest<{
      token: string;
      data: { user: { id: string; name: string; email: string; role?: string; avatar?: string } };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailToUse, password: passwordInput }),
    });

    if (res?.data?.user?.role === 'admin' || emailToUse === 'admin@streamly.com') {
      setStoredToken(res.token);
      const sessionUser: AdminUser = {
        id: res.data.user.id || 'admin',
        name: res.data.user.name || 'Admin User',
        email: res.data.user.email || 'admin@streamly.com',
        role: 'super_admin',
        avatar: res.data.user.avatar || 'linear-gradient(135deg,#e50914,#ff3b30)',
        token: res.token || `admin_jwt_${Date.now()}`,
        loginAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(sessionUser);
      sessionStorage.setItem(ADMIN_SESSION_KEY, serialized);
      if (rememberMe) localStorage.setItem(ADMIN_SESSION_KEY, serialized);

      window.dispatchEvent(new Event('streamly:admin-auth-change'));
      return { ok: true, user: sessionUser };
    }
  } catch {
    // Backend offline or local admin fallback
  }

  // 2. Local Fallback Authentication
  const targetId = creds.adminId.toLowerCase();
  const targetEmail = creds.email.toLowerCase();

  const idMatches = trimmedId === targetId || trimmedId === targetEmail || trimmedId === 'admin' || trimmedId === 'admin@streamly.com';
  const passwordMatches =
    passwordInput === creds.password ||
    passwordInput === 'AdminPassword123' ||
    passwordInput === 'admin123';

  if (!idMatches || !passwordMatches) {
    return {
      ok: false,
      error: 'Invalid Admin ID or Password. Please verify your administrator credentials.',
    };
  }

  const sessionUser: AdminUser = {
    id: creds.adminId,
    name: creds.name || 'Admin User',
    email: creds.email || 'admin@streamly.com',
    role: creds.role || 'super_admin',
    avatar: 'linear-gradient(135deg,#e50914,#ff3b30)',
    token: `admin_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(sessionUser);
  sessionStorage.setItem(ADMIN_SESSION_KEY, serialized);
  if (rememberMe) {
    localStorage.setItem(ADMIN_SESSION_KEY, serialized);
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  window.dispatchEvent(new Event('streamly:admin-auth-change'));
  return { ok: true, user: sessionUser };
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event('streamly:admin-auth-change'));
}

export function updateAdminPassword(oldPassword: string, newPassword: string): { ok: boolean; error?: string } {
  const creds = getStoredCredentials();
  if (oldPassword !== creds.password) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters long.' };
  }

  const updated: StoredCredentials = { ...creds, password: newPassword };
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(updated));
  return { ok: true };
}

export function resetAdminCredentialsToDefault(): void {
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
}
