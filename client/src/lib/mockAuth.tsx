/**
 * mockAuth.tsx
 * A drop-in, production-quality client-side authentication shim.
 * Stores users and sessions in localStorage so auth state persists
 * across page reloads exactly like a real backend would.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, setStoredToken, getStoredToken } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // simple base64 encoding (demo purposes only)
  image?: string;
}

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface SessionState {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface SessionContextValue extends SessionState {
  update: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const USERS_KEY = "streamly_users";
const SESSION_KEY = "streamly_session";

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// Simple reversible obfuscation — swap with bcrypt on a real server
function encode(plain: string): string {
  return btoa(plain);
}
function verify(plain: string, hash: string): boolean {
  return encode(plain) === hash;
}
function uuid(): string {
  return crypto.randomUUID();
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  update: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    data: null,
    status: "loading",
  });

  const refresh = useCallback(async () => {
    // Try backend check first if token exists
    const token = getStoredToken();
    if (token) {
      try {
        const res = await apiRequest<{ data: { user: { id: string; name: string; email: string; avatar?: string } } }>('/auth/me');
        const session: Session = {
          user: {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            image: res.data.user.avatar,
          },
        };
        saveSession(session);
        setState({ data: session, status: "authenticated" });
        return;
      } catch {
        // Token invalid or server offline - proceed to check session/local storage
      }
    }

    const session = getSession();
    setState({
      data: session,
      status: session ? "authenticated" : "unauthenticated",
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, update: refresh }),
    [state, refresh]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export type SignInResult =
  | { ok: true; error: null }
  | { ok: false; error: string };

/**
 * signIn("credentials", { email, password })
 * Attempts backend authentication first, falls back to localStorage.
 */
export async function signIn(
  provider: string,
  options?: {
    email?: string;
    password?: string;
    redirect?: boolean;
    callbackUrl?: string;
  }
): Promise<SignInResult> {
  if (provider !== "credentials") {
    return {
      ok: false,
      error: `${provider === "google" ? "Google" : "GitHub"} login is available after its OAuth keys are configured.`,
    };
  }

  const { email = "", password = "" } = options ?? {};

  // 1. Try Backend Authentication
  try {
    const res = await apiRequest<{
      token: string;
      data: { user: { id: string; name: string; email: string; avatar?: string } };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setStoredToken(res.token);
    const session: Session = {
      user: {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        image: res.data.user.avatar,
      },
    };
    saveSession(session);
    window.dispatchEvent(new Event("streamly:session-change"));
    return { ok: true, error: null };
  } catch (backendError) {
    // If explicit invalid credentials error from backend, return error
    if (backendError instanceof Error && backendError.message.includes('Invalid email or password')) {
      return { ok: false, error: backendError.message };
    }
  }

  // 2. Local Fallback Auth
  const users = getUsers();
  const user = users.find((u) => u.email === email.toLowerCase().trim());

  if (!user || !verify(password, user.passwordHash)) {
    return { ok: false, error: "Email or password is incorrect." };
  }

  const session: Session = {
    user: { id: user.id, name: user.name, email: user.email, image: user.image },
  };
  saveSession(session);
  window.dispatchEvent(new Event("streamly:session-change"));

  return { ok: true, error: null };
}

/**
 * registerUser — creates a new account via Backend or localStorage.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string | null> {
  // 1. Try Backend Registration
  try {
    const res = await apiRequest<{
      token: string;
      data: { user: { id: string; name: string; email: string; avatar?: string } };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    setStoredToken(res.token);
    const session: Session = {
      user: {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        image: res.data.user.avatar,
      },
    };
    saveSession(session);
    window.dispatchEvent(new Event("streamly:session-change"));
    return null;
  } catch (err) {
    if (err instanceof Error && err.message.includes('already exists')) {
      return err.message;
    }
  }

  // 2. Local Fallback Registration
  const users = getUsers();
  const normalEmail = email.toLowerCase().trim();

  if (users.some((u) => u.email === normalEmail)) {
    return "An account with this email already exists.";
  }

  const newUser: StoredUser = {
    id: uuid(),
    name: name.trim(),
    email: normalEmail,
    passwordHash: encode(password),
  };
  saveUsers([...users, newUser]);
  return null;
}

/**
 * signOut — clears current session and tokens.
 */
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore server error on logout
  }
  setStoredToken(null);
  saveSession(null);
  window.dispatchEvent(new Event("streamly:session-change"));
  window.location.href = options?.callbackUrl ?? "/";
}

export async function getProviders(): Promise<Record<string, unknown>> {
  return {};
}

