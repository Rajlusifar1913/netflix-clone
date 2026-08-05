import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "@/lib/mockAuth";
import type { MediaItem } from "@/types/media";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveProfile { name: string; avatar: string; kids?: boolean }
interface AppState {
  profile: ActiveProfile | null;
  setProfile: (profile: ActiveProfile) => void;
  selectedMedia: MediaItem | null;
  openMedia: (media: MediaItem) => void;
  closeMedia: () => void;
  myList: number[];
  toggleList: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

// ─── Route Guards ─────────────────────────────────────────────────────────────

const PROTECTED_PATHS = ["/browse", "/profiles"];
const AUTH_PATHS = ["/login", "/register"];

function RouteGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (status === "loading") return;

    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

    if (status === "unauthenticated" && isProtected) {
      navigate("/login", { replace: true });
    } else if (status === "authenticated" && isAuthPage) {
      navigate("/profiles", { replace: true });
    }
  }, [status, pathname, navigate]);

  return <>{children}</>;
}

// ─── App state ────────────────────────────────────────────────────────────────

function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ActiveProfile | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [myList, setMyList] = useState<number[]>([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("streamly-profile");
    const savedList = localStorage.getItem("streamly-list");
    if (savedProfile) setProfileState(JSON.parse(savedProfile) as ActiveProfile);
    if (savedList) setMyList(JSON.parse(savedList) as number[]);
  }, []);

  const setProfile = useCallback((next: ActiveProfile) => {
    setProfileState(next);
    localStorage.setItem("streamly-profile", JSON.stringify(next));
  }, []);

  const toggleList = useCallback((id: number) => {
    setMyList((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      localStorage.setItem("streamly-list", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      profile,
      setProfile,
      selectedMedia,
      openMedia: setSelectedMedia,
      closeMedia: () => setSelectedMedia(null),
      myList,
      toggleList,
    }),
    [profile, selectedMedia, myList, setProfile, toggleList]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Composed provider ────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppStateProvider>
        <RouteGuard>{children}</RouteGuard>
      </AppStateProvider>
    </SessionProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
