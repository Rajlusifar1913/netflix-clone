import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { signOut, useSession } from "@/lib/mockAuth";
import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { cn } from "@/lib/utils";

const links = ["Home", "TV Shows", "Movies", "New & Popular", "My List"];

export function Navbar({ onSearch }: { onSearch?: (value: string) => void }) {
  const { data: session } = useSession();
  const { profile } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [searching, setSearching] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
      <Logo href="/browse" className="mr-7 text-[1.45rem] sm:text-[1.65rem]" />

      <nav className="hidden items-center gap-5 lg:flex">
        {links.map((link, index) => (
          <Link
            key={link}
            to={link === "My List" ? "#my-list" : "#catalog"}
            className={cn(
              "text-[13px] text-[#e5e5e5] hover:text-[#aaa]",
              index === 0 && "font-semibold text-white"
            )}
          >
            {link}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => setMobile(!mobile)}
        className="p-2 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {mobile && (
        <nav className="absolute left-4 top-16 w-52 border-t-2 border-white bg-black/95 py-2 shadow-2xl lg:hidden">
          {links.map((link) => (
            <Link
              key={link}
              to="#catalog"
              onClick={() => setMobile(false)}
              className="block px-5 py-3 text-sm text-[#ccc] hover:bg-white/10 hover:text-white"
            >
              {link}
            </Link>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div
          className={cn(
            "flex items-center overflow-hidden border transition-all",
            searching
              ? "w-36 border-white/70 bg-black/80 sm:w-60"
              : "w-9 border-transparent bg-transparent"
          )}
        >
          <button
            onClick={() => setSearching(!searching)}
            className="grid size-9 shrink-0 place-items-center"
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
          className="relative hidden p-1 sm:block"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-0 top-0 size-2 rounded-full bg-[#e50914]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="flex items-center gap-1"
            aria-expanded={menu}
          >
            <span
              style={{
                background:
                  profile?.avatar ?? "linear-gradient(135deg,#0072d2,#62d5ff)",
              }}
              className="grid size-8 place-items-center rounded text-xs font-bold"
            >
              {profile?.name?.[0] ?? session?.user?.name?.[0] ?? "S"}
            </span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                menu && "rotate-180"
              )}
            />
          </button>

          {menu && (
            <div className="absolute right-0 top-11 w-56 rounded-sm border border-white/15 bg-black/95 p-2 shadow-2xl">
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-sm font-semibold">
                  {profile?.name ?? session?.user?.name ?? "Member"}
                </p>
                <p className="truncate text-xs text-[#888]">
                  {session?.user?.email}
                </p>
              </div>
              <Link
                to="/profiles"
                className="block px-3 py-3 text-sm hover:bg-white/10"
                onClick={() => setMenu(false)}
              >
                Switch profiles
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full border-t border-white/10 px-3 py-3 text-left text-sm hover:bg-white/10"
              >
                Sign out of Streamly
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
