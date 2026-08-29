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
import type { Toast } from "@/components/ToastContainer";

// ─── Types ────────────────────────────────────────────────────────────────────

import { apiRequest } from "@/lib/api";

interface ActiveProfile { id?: string; name: string; avatar: string; kids?: boolean }

export interface WatchHistoryEntry {
  id: number;
  title: string;
  progress: number; // 0-100
  backdrop_path: string | null;
  poster_path: string | null;
  media_type?: string;
  watchedAt: number; // timestamp ms
}

interface AppState {
  profile: ActiveProfile | null;
  setProfile: (profile: ActiveProfile) => void;
  selectedMedia: MediaItem | null;
  openMedia: (media: MediaItem) => void;
  closeMedia: () => void;
  myList: number[];
  toggleList: (id: number) => void;
  // Toast system
  toasts: Toast[];
  showToast: (message: string, variant?: Toast["variant"], duration?: number) => void;
  dismissToast: (id: string) => void;
  // Watch history
  watchHistory: WatchHistoryEntry[];
  addToWatchHistory: (entry: WatchHistoryEntry) => void;
  clearWatchHistory: () => void;
}

const AppContext = createContext<AppState | null>(null);

// ─── Route Guards ─────────────────────────────────────────────────────────────

const PROTECTED_PATHS = ["/browse", "/profiles", "/tv-shows", "/movies", "/latest", "/my-list", "/watch", "/account", "/search", "/help", "/title"];
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
      navigate("/browse", { replace: true });
    }
  }, [status, pathname, navigate]);

  return <>{children}</>;
}

// ─── App state ────────────────────────────────────────────────────────────────

const WATCH_HISTORY_KEY = "streamly-watch-history";
const MAX_WATCH_HISTORY = 20;

function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ActiveProfile | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [myList, setMyList] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("streamly-profile");
    const savedList = localStorage.getItem("streamly-list");
    const savedHistory = localStorage.getItem(WATCH_HISTORY_KEY);
    if (savedProfile) setProfileState(JSON.parse(savedProfile) as ActiveProfile);
    if (savedList) setMyList(JSON.parse(savedList) as number[]);
    if (savedHistory) setWatchHistory(JSON.parse(savedHistory) as WatchHistoryEntry[]);
  }, []);

  const setProfile = useCallback((next: ActiveProfile) => {
    setProfileState(next);
    localStorage.setItem("streamly-profile", JSON.stringify(next));
  }, []);

  const toggleList = useCallback((id: number) => {
    setMyList((current) => {
      const isRemoving = current.includes(id);
      const next = isRemoving
        ? current.filter((item) => item !== id)
        : [...current, id];
      localStorage.setItem("streamly-list", JSON.stringify(next));

      // Sync with backend if profile has an ID
      if (profile?.id) {
        apiRequest(`/profiles/${profile.id}/mylist`, {
          method: "POST",
          body: JSON.stringify({
            mediaId: id,
            mediaType: "movie",
            title: "Title",
          }),
        }).catch(() => { /* offline fallback */ });
      }

      return next;
    });
  }, [profile]);

  // ── Toast system ─────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, variant: Toast["variant"] = "info", duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Watch history ─────────────────────────────────────────────────────────────
  const addToWatchHistory = useCallback((entry: WatchHistoryEntry) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((e) => e.id !== entry.id);
      const updated = [entry, ...filtered].slice(0, MAX_WATCH_HISTORY);
      try {
        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }

      // Sync with backend profile watch history
      if (profile?.id) {
        apiRequest(`/profiles/${profile.id}/history`, {
          method: "POST",
          body: JSON.stringify({
            mediaId: entry.id,
            mediaType: entry.media_type || "movie",
            title: entry.title,
            posterPath: entry.poster_path,
            backdropPath: entry.backdrop_path,
            progress: entry.progress,
            duration: 100,
          }),
        }).catch(() => { /* offline fallback */ });
      }

      return updated;
    });
  }, [profile]);

  const clearWatchHistory = useCallback(() => {
    setWatchHistory([]);
    localStorage.removeItem(WATCH_HISTORY_KEY);
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
      toasts,
      showToast,
      dismissToast,
      watchHistory,
      addToWatchHistory,
      clearWatchHistory,
    }),
    [profile, selectedMedia, myList, toasts, watchHistory, setProfile, toggleList, showToast, dismissToast, addToWatchHistory, clearWatchHistory]
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
