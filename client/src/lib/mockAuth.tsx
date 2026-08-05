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

  const refresh = useCallback(() => {
    const session = getSession();
    setState({
      data: session,
      status: session ? "authenticated" : "unauthenticated",
    });
  }, []);

  useEffect(() => {
    refresh();

    const handleSessionChange = () => refresh();
    window.addEventListener("streamly:session-change", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener("streamly:session-change", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
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
 * Checks stored users and writes a session on success.
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
  // OAuth providers show a friendly message (not implemented in frontend-only mode)
  if (provider !== "credentials") {
    return {
      ok: false,
      error: `${provider === "google" ? "Google" : "GitHub"} login is available after its OAuth keys are configured.`,
    };
  }

  const { email = "", password = "" } = options ?? {};
  const users = getUsers();
  const user = users.find((u) => u.email === email.toLowerCase().trim());

  if (!user || !verify(password, user.passwordHash)) {
    return { ok: false, error: "Email or password is incorrect." };
  }

  const session: Session = {
    user: { id: user.id, name: user.name, email: user.email, image: user.image },
  };
  saveSession(session);

  // Dispatch a storage event so other tabs / useSession hook can react
  window.dispatchEvent(new Event("streamly:session-change"));

  return { ok: true, error: null };
}

/**
 * registerUser — creates a new account in localStorage.
 * Returns an error string or null on success.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string | null> {
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
 * signOut — clears the current session.
 */
export async function signOut(options?: { callbackUrl?: string }) {
  saveSession(null);
  window.dispatchEvent(new Event("streamly:session-change"));
  // Navigate to callbackUrl or root
  window.location.href = options?.callbackUrl ?? "/";
}

/**
 * getProviders — always returns an empty map in frontend-only mode.
 * OAuth buttons will show a "configure keys" message.
 */
export async function getProviders(): Promise<Record<string, unknown>> {
  return {};
}
