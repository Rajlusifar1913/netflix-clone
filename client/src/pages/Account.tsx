import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useSession, signOut } from "@/lib/mockAuth";
import { useApp } from "@/components/AppProvider";
import { CreditCard, Shield, ChevronRight, LogOut } from "lucide-react";

export default function AccountPage() {
  const { data: session } = useSession();
  const { profile } = useApp();

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Account & Billing</h1>
        <p className="mt-2 text-sm text-[#aaa]">Manage your membership, billing, profiles, and streaming settings.</p>

        {/* Membership Details */}
        <section className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-[#181818] shadow-lg">
          <div className="flex flex-col justify-between border-b border-white/10 p-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-[#e50914]" />
                <h2 className="text-lg font-semibold">MEMBERSHIP & BILLING</h2>
              </div>
              <p className="mt-2 text-sm text-[#ccc]">{session?.user?.email || "user@example.com"}</p>
              <p className="text-xs text-[#888]">Password: ••••••••••••</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
              <button className="rounded border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">
                Change Email
              </button>
              <button className="rounded border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">
                Change Password
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <CreditCard className="size-6 text-[#46d369]" />
              <div>
                <p className="text-sm font-semibold">•••• •••• •••• 4242</p>
                <p className="text-xs text-[#888]">Your next billing date is September 5, 2026</p>
              </div>
            </div>
            <button className="mt-4 rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#b81d24] sm:mt-0">
              Manage Payment Info
            </button>
          </div>
        </section>

        {/* Plan Details */}
        <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#181818] p-6 shadow-lg">
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#888]">PLAN DETAILS</h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-bold text-white">PREMIUM</span>
                <p className="text-base font-bold text-white">Ultra HD 4K + HDR (4 Screens at once)</p>
              </div>
            </div>
            <button className="mt-4 rounded border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 sm:mt-0">
              Change Plan
            </button>
          </div>
        </section>

        {/* Profiles Section */}
        <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#181818] p-6 shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#888]">PROFILES & PARENTAL CONTROLS</h2>
          <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded bg-gradient-to-tr from-blue-600 to-indigo-400 font-black text-white">
                {profile?.name?.[0] || "A"}
              </div>
              <div>
                <p className="text-sm font-semibold">{profile?.name || "Active Profile"}</p>
                <p className="text-xs text-[#46d369]">All Maturity Levels • Viewing Restrictions: Off</p>
              </div>
            </div>
            <Link to="/profiles" className="flex items-center gap-1 text-xs text-[#aaa] hover:text-white">
              Switch <ChevronRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Settings & Sign Out */}
        <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#181818] p-6 shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#888]">SETTINGS</h2>
          <div className="mt-4 flex flex-col gap-3">
            <button className="flex items-center justify-between text-left text-sm text-[#ccc] hover:text-white">
              <span>Test participation</span>
              <ChevronRight className="size-4 text-[#666]" />
            </button>
            <button className="flex items-center justify-between text-left text-sm text-[#ccc] hover:text-white">
              <span>Download your personal information</span>
              <ChevronRight className="size-4 text-[#666]" />
            </button>
            <button
              onClick={() => signOut()}
              className="mt-4 flex items-center justify-center gap-2 rounded bg-white/10 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-white/15"
            >
              <LogOut className="size-4" /> Sign out of all devices
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
