import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut, useSession } from "@/lib/mockAuth";
import { isAdminAuthenticated, getAdminSession } from "@/lib/adminAuth";
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Search, Settings, Users, X, Shield } from "lucide-react";
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

export function Navbar({ onSearch }: { onSearch?: (value: string) => void }) {
  const { data: session } = useSession();
  const { profile } = useApp();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searching, setSearching] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
          className={cn(
            "flex items-center overflow-hidden border transition-all rounded-full",
            searching
              ? "w-36 border-white/70 bg-black/80 sm:w-60"
              : "w-9 border-transparent bg-transparent"
          )}
        >
          <button
            onClick={() => setSearching(!searching)}
            className="grid size-9 shrink-0 place-items-center text-gray-300 transition-colors hover:bg-white/10 hover:text-white rounded-full"
            aria-label={searching ? "Close search" : "Search"}
          >
            {searching ? <X className="size-4" /> : <Search className="size-5" />}
          </button>
          <input
            ref={searchRef}
            onChange={(e) => onSearch?.(e.target.value)}
            aria-label="Search titles"
            placeholder="Titles, people, genres"
            className="min-w-0 flex-1 bg-transparent pr-2 text-xs outline-none placeholder:text-[#aaa]"
          />
        </div>

        <button
          className="relative hidden rounded-full p-2 text-gray-300 transition-all hover:bg-white/10 hover:text-white sm:block"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 size-2 rounded-full bg-[#e50914]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
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
