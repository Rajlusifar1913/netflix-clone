/**
 * adminAuth.ts
 * Dedicated client-side authentication and session manager for Streamly Admin Portal.
 *
 * SEC-2 FIX: Admin credentials are NO LONGER stored in localStorage.
 *   - Previously, the admin email + plaintext password were persisted in localStorage.
 *   - Any XSS script or person with browser access could read them.
 *   - Now: credentials exist only in-memory during the login flow.
 *
 * SEC-3 FIX: The local fallback auth path that generated fake JWT tokens has been REMOVED.
 *   - Previously, if the backend was unreachable, the app would create a made-up
 *     `admin_jwt_${Date.now()}` token and grant admin access.
 *   - This was a security bypass — admin access must ALWAYS require a real server response.
 *   - Now: if the backend is unreachable, adminLogin returns an error immediately.
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

import { apiRequest, setSessionFlag } from "./api";

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

  // Always try the real backend — no local fallback (SEC-3)
  try {
    const emailToUse = trimmedId.includes('@') ? trimmedId : 'admin@streamly.com';
    const res = await apiRequest<{
      token: string;
      data: { user: { id: string; name: string; email: string; role?: string; avatar?: string } };
    }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email: emailToUse, password: passwordInput }),
    });

    if (res?.token) {
      // Store token in session flag (the real JWT goes in the httpOnly cookie from the server)
      setSessionFlag(true);
      const sessionUser: AdminUser = {
        id: res.data?.user?.id || 'admin',
        name: res.data?.user?.name || 'Admin User',
        email: res.data?.user?.email || 'admin@streamly.com',
        role: 'super_admin',
        avatar: res.data?.user?.avatar || 'linear-gradient(135deg,#e50914,#ff3b30)',
        token: res.token,
        loginAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(sessionUser);
      sessionStorage.setItem(ADMIN_SESSION_KEY, serialized);
      if (rememberMe) localStorage.setItem(ADMIN_SESSION_KEY, serialized);

      window.dispatchEvent(new Event('streamly:admin-auth-change'));
      return { ok: true, user: sessionUser };
    }

    return {
      ok: false,
      error: 'Authentication failed. Please verify your admin credentials.',
    };
  } catch (err) {
    // SEC-3: No fallback to a fake local token — server must be reachable for admin login.
    if (err instanceof Error && err.message.includes('Invalid')) {
      return { ok: false, error: 'Invalid admin credentials. Please try again.' };
    }
    return {
      ok: false,
      error: 'Unable to connect to the server. Please ensure the backend is running.',
    };
  }
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  setSessionFlag(false);
  window.dispatchEvent(new Event('streamly:admin-auth-change'));
}

export async function updateAdminPassword(oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiRequest("/payments/update-credentials", {
      method: "POST",
      body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update admin password.",
    };
  }
}

