import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, CreditCard, PlayCircle, Smartphone, KeyRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FAQ } from "@/components/FAQ";

const QUICK_LINKS = [
  { icon: KeyRound, label: "Reset password", desc: "Regain access to your account" },
  { icon: CreditCard, label: "Update payment method", desc: "Manage billing info & cards" },
  { icon: PlayCircle, label: "Fix streaming quality", desc: "Troubleshoot 4K / HD playback" },
  { icon: Smartphone, label: "Supported devices", desc: "Check TV, phone & browser compatibility" },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-12">
        <div className="flex items-center gap-4">
          <Logo href="/browse" />
          <span className="border-l border-white/20 pl-4 text-sm font-semibold text-[#aaa]">Help Center</span>
        </div>
        <Link to="/browse" className="text-xs font-medium text-white hover:underline">
          Back to Streamly
        </Link>
      </header>

      {/* Hero Banner with Search */}
      <section className="relative bg-gradient-to-b from-[#222] to-[#141414] px-6 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">How can we help?</h1>
        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 size-5 text-[#888]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="What do you need help with?"
              className="w-full rounded-md border border-white/20 bg-black/60 py-3.5 pl-12 pr-4 text-sm text-white placeholder-[#888] backdrop-blur focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/40 focus:shadow-[0_0_18px_rgba(229,9,20,0.35)] outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-lg font-bold">Quick Assistance</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#1f1f1f] p-5 shadow transition hover:border-white/30 hover:bg-[#282828]"
              >
                <Icon className="size-6 text-[#e50914]" />
                <h3 className="mt-3 text-sm font-bold text-white">{item.label}</h3>
                <p className="mt-1 text-xs text-[#999]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <FAQ />
      </section>

      <footer className="mt-16 border-t border-white/10 px-6 py-10 text-center text-xs text-[#777]">
        <p>© 2026 Streamly Support Services. All rights reserved.</p>
      </footer>
    </main>
  );
}
