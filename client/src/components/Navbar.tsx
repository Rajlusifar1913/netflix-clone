import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut, useSession } from "@/lib/mockAuth";
import { isAdminAuthenticated, getAdminSession } from "@/lib/adminAuth";
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Search, Settings, Users, X, Shield, Sparkles, Film, Tv, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", path: "/browse" },
  { label: "TV Shows", path: "/tv-shows" },
  { label: "Movies", path: "/movies" },
  { label: "New & Popular", path: "/latest" },
  { label: "My List", path: "/my-list" },
];

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: "release" | "series" | "recommendation" | "security";
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "New 4K Release",
    desc: "Dune: Part Two is now streaming in Ultra 4K HDR.",
    time: "2 hours ago",
    unread: true,
    type: "release",
    link: "/title/1",
  },
  {
    id: "n2",
    title: "Series Premiere",
    desc: "Stranger Things Season 5 is currently #1 trending worldwide.",
    time: "5 hours ago",
    unread: true,
    type: "series",
    link: "/title/4",
  },
  {
    id: "n3",
    title: "Top Pick For You",
    desc: "Because you watched Oppenheimer, you might like Interstellar.",
    time: "1 day ago",
    unread: true,
    type: "recommendation",
    link: "/title/8",
  },
  {
    id: "n4",
    title: "Account Security",
    desc: "Your subscription and profile preferences were synced successfully.",
    time: "2 days ago",
    unread: false,
    type: "security",
    link: "/account",
  },
];

import { apiRequest } from "@/lib/api";

export function Navbar({ onSearch }: { onSearch?: (value: string) => void }) {
  const { data: session } = useSession();
  const { profile, showToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menu, setMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userKey = session?.user?.email?.toLowerCase().trim() || session?.user?.id || "default";
  const readNotifsKey = `streamly_read_notifs_${userKey}`;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const readIds = (JSON.parse(localStorage.getItem(readNotifsKey) || "[]") as string[]) || [];
      return INITIAL_NOTIFICATIONS.map((n) => ({
        ...n,
        unread: readIds.includes(n.id) ? false : n.unread,
      }));
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [mobile, setMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Fetch live notifications from backend
  useEffect(() => {
    apiRequest<{
      data: {
        notifications: Array<{
          id: string;
          title: string;
          message: string;
          isRead: boolean;
          type: string;
          link?: string;
          createdAt: string;
        }>;
        unreadCount: number;
      };
    }>("/notifications")
      .then((res) => {
        if (res?.data?.notifications && res.data.notifications.length > 0) {
          const readIds = (JSON.parse(localStorage.getItem(readNotifsKey) || "[]") as string[]) || [];
          const formatted: NotificationItem[] = res.data.notifications.map((n) => ({
            id: n.id,
            title: n.title,
            desc: n.message,
            time: "Recently",
            unread: readIds.includes(n.id) ? false : !n.isRead,
            type: (n.type as any) || "release",
            link: n.link || "/browse",
          }));
          setNotifications(formatted);
        }
      })
      .catch(() => { /* keep initial fallback */ });
  }, [session, readNotifsKey]);

  const handleToggleNotifications = () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setMenu(false);

    if (nextState && unreadCount > 0) {
      // Once checked, clear red indicator immediately and save read state
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, unread: false }));
        try {
          const allIds = updated.map((n) => n.id);
          localStorage.setItem(readNotifsKey, JSON.stringify(allIds));
        } catch { /* ignore */ }
        return updated;
      });

      try {
        apiRequest("/notifications/mark-all-read", { method: "PATCH" }).catch(() => {});
      } catch { /* ignore */ }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      try {
        const allIds = updated.map((n) => n.id);
        localStorage.setItem(readNotifsKey, JSON.stringify(allIds));
      } catch { /* ignore */ }
      return updated;
    });
    try {
      await apiRequest("/notifications/mark-all-read", { method: "PATCH" });
    } catch { /* ignore */ }
    showToast("All notifications marked as read", "info");
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
      try {
        const readIds = (JSON.parse(localStorage.getItem(readNotifsKey) || "[]") as string[]) || [];
        if (!readIds.includes(id)) {
          localStorage.setItem(readNotifsKey, JSON.stringify([...readIds, id]));
        }
      } catch { /* ignore */ }
      return updated;
    });
    if (!id.startsWith("n")) {
      try {
        await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    const checkAdmin = () => {
      const adminSession = getAdminSession();
      const isAuth =
        isAdminAuthenticated() ||
        !!adminSession ||
        session?.user?.role === "admin" ||
        session?.user?.email?.toLowerCase() === "admin@streamly.com" ||
        session?.user?.email?.toLowerCase() === "admin@streamly.app" ||
        session?.user?.id === "usr_admin" ||
        session?.user?.id === "admin";
      setIsAdmin(isAuth);
    };

    checkAdmin();
    window.addEventListener("streamly:admin-auth-change", checkAdmin);
    window.addEventListener("streamly:session-change", checkAdmin);
    return () => {
      window.removeEventListener("streamly:admin-auth-change", checkAdmin);
      window.removeEventListener("streamly:session-change", checkAdmin);
    };
  }, [session]);

  useEffect(() => {
    const listener = () => setScrolled(window.scrollY > 20);
    listener();
    window.addEventListener("scroll", listener);
    return () => window.removeEventListener("scroll", listener);
  }, []);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  // Click-outside listener for Search, Notifications, and Menu dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        searching &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        if (!searchValue.trim()) {
          setSearching(false);
        }
      }

      if (
        notifOpen &&
        notifContainerRef.current &&
        !notifContainerRef.current.contains(target)
      ) {
        setNotifOpen(false);
      }

      if (
        menu &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(target)
      ) {
        setMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [searching, searchValue, notifOpen, menu]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-[68px] items-center px-4 transition-all duration-500 sm:px-[4vw]",
        scrolled
          ? "bg-[#141414]/95 shadow-lg backdrop-blur-xl"
          : "bg-gradient-to-b from-black/85 to-transparent"
      )}
    >
      <Logo href="/browse" className="mr-7 text-[1.45rem] sm:text-[1.65rem] transition-transform duration-200 hover:scale-105" />

      <nav className="hidden items-center gap-1 lg:flex">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "font-bold text-white bg-white/15 shadow-sm"
                  : "text-[#e5e5e5]/80 hover:text-white hover:bg-white/15 hover:scale-[1.03]"
              )}
            >
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ml-1.5 border shadow-sm",
              location.pathname.startsWith("/admin")
                ? "bg-[#e50914] text-white border-[#e50914] shadow-md shadow-red-950/50"
                : "bg-red-600/15 text-red-400 border-red-500/30 hover:bg-[#e50914] hover:text-white hover:border-[#e50914] hover:scale-[1.03]"
            )}
          >
            <Shield className="size-3.5 shrink-0" />
            <span>Admin Studio</span>
          </Link>
        )}
      </nav>

      <button
        onClick={() => setMobile(!mobile)}
        className="rounded-full p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {mobile && (
        <nav className="absolute left-4 top-16 w-52 rounded-2xl border border-white/15 bg-black/95 p-2 shadow-2xl backdrop-blur-md lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobile(false)}
              className={cn(
                "block rounded-full px-4 py-2 text-sm transition-all duration-150 my-0.5",
                location.pathname === link.path
                  ? "bg-white/20 font-semibold text-white"
                  : "text-[#ccc] hover:bg-white/10 hover:text-white hover:translate-x-1"
              )}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobile(false)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 my-1 border border-red-500/30",
                location.pathname.startsWith("/admin")
                  ? "bg-[#e50914] text-white"
                  : "bg-red-600/20 text-red-300 hover:bg-red-600/30 hover:text-white"
              )}
            >
              <Shield className="size-4 text-red-400" />
              <span>Admin Studio</span>
            </Link>
          )}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div
          ref={searchContainerRef}
          className={cn(
            "flex items-center overflow-hidden border transition-all duration-300 rounded-full",
            searching
              ? "w-48 sm:w-64 border-2 border-[#e50914] bg-black/90 shadow-[0_0_18px_rgba(229,9,20,0.5)] ring-1 ring-[#e50914]/50 search-glow-enter"
              : "w-9 border-transparent bg-transparent"
          )}
        >
          <button
            onClick={() => {
              if (searching) {
                // If closing via X button, clear value and close
                setSearching(false);
                setSearchValue("");
                onSearch?.("");
              } else {
                setSearching(true);
              }
            }}
            className={cn(
              "grid size-9 shrink-0 place-items-center transition-colors rounded-full",
              searching
                ? "text-[#e50914] hover:bg-white/10 hover:text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            )}
            aria-label={searching ? "Close search" : "Search"}
          >
            {searching ? <X className="size-4" /> : <Search className="size-5" />}
          </button>
          <input
            ref={searchRef}
            value={searchValue}
            onChange={(e) => {
              const val = e.target.value;
              setSearchValue(val);
              onSearch?.(val);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearching(false);
                setSearchValue("");
                onSearch?.("");
              }
            }}
            aria-label="Search titles"
            placeholder="Titles, people, genres"
            className="min-w-0 flex-1 bg-transparent pr-3 text-xs text-white outline-none placeholder:text-[#888]"
          />
        </div>

        {/* Functional Notifications Bell with Popover */}
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative hidden rounded-full p-2 text-gray-300 transition-all hover:bg-white/10 hover:text-white sm:block"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-[#e50914] ring-2 ring-black" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/15 bg-black/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#e50914] px-2 py-0.5 text-[10px] font-black text-white">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#aaa] hover:text-white transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto divide-y divide-white/5 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#888]">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          setNotifOpen(false);
                          navigate(n.link);
                        }
                      }}
                      className={cn(
                        "group cursor-pointer rounded-xl p-2.5 transition-all hover:bg-white/10",
                        n.unread ? "bg-white/[0.04]" : "opacity-75 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#e50914]/20 text-[#e50914] group-hover:bg-[#e50914] group-hover:text-white transition">
                          {n.type === "release" && <Film className="size-3.5" />}
                          {n.type === "series" && <Tv className="size-3.5" />}
                          {n.type === "recommendation" && <Sparkles className="size-3.5" />}
                          {n.type === "security" && <ShieldCheck className="size-3.5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-xs font-bold text-white group-hover:text-[#e50914] transition">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-[#777] shrink-0">{n.time}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#aaa] leading-snug">
                            {n.desc}
                          </p>
                        </div>

                        {n.unread && (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#e50914]" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 border-t border-white/10 pt-2.5 text-center">
                <Link
                  to="/account"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-semibold text-[#888] hover:text-white transition-colors"
                >
                  Manage notification preferences →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div ref={menuContainerRef} className="relative">
          <button
            onClick={() => {
              setMenu(!menu);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1 rounded-full p-1 transition-all hover:bg-white/10"
            aria-expanded={menu}
          >
            <span
              style={{
                background:
                  profile?.avatar ?? "linear-gradient(135deg,#0072d2,#62d5ff)",
              }}
              className="grid size-8 place-items-center rounded-full text-xs font-bold"
            >
              {profile?.name?.[0] ?? session?.user?.name?.[0] ?? "S"}
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-gray-300 transition-transform hover:text-white",
                menu && "rotate-180"
              )}
            />
          </button>

          {menu && (
            <div className="absolute right-0 top-12 w-60 rounded-2xl border border-white/15 bg-black/95 p-2 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
                <span
                  style={{
                    background:
                      profile?.avatar ?? "linear-gradient(135deg,#0072d2,#62d5ff)",
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow"
                >
                  {profile?.name?.[0] ?? session?.user?.name?.[0] ?? "S"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile?.name ?? session?.user?.name ?? "Member"}
                  </p>
                  <p className="truncate text-xs text-[#888]">
                    {session?.user?.email ?? "user@streamly.app"}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profiles"
                  className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white my-0.5 text-gray-300"
                  onClick={() => setMenu(false)}
                >
                  <Users className="size-4 text-sky-400" />
                  <span>Switch profiles</span>
                </Link>

                <Link
                  to="/account"
                  className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white my-0.5 text-gray-300"
                  onClick={() => setMenu(false)}
                >
                  <Settings className="size-4 text-emerald-400" />
                  <span>Account & Billing</span>
                </Link>

                <Link
                  to="/help"
                  className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white my-0.5 text-gray-300"
                  onClick={() => setMenu(false)}
                >
                  <HelpCircle className="size-4 text-purple-400" />
                  <span>Help Center</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white my-0.5 text-gray-300"
                    onClick={() => setMenu(false)}
                  >
                    <Shield className="size-4 text-red-500" />
                    <span>Admin Studio</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-white/10 pt-1 mt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 rounded-full px-3.5 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="size-4 text-red-400" />
                  <span>Sign out of Streamly</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
