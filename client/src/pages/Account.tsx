import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  KeyRound,
  Mail,
  Search,
  Shield,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { useSession, signOut } from "@/lib/mockAuth";
import { apiRequest } from "@/lib/api";
import { PlanModal, PLANS } from "@/components/PlanModal";
import { StripePaymentModal, type SubscriptionData } from "@/components/StripePaymentModal";

interface SubscriptionState {
  email: string;
  name: string;
  subscription: {
    status: string;
    planId: string;
    planName: string;
    planSpecs: string;
    cardLast4: string;
    cardBrand: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { profile } = useApp();

  const [subData, setSubData] = useState<SubscriptionState>({
    email: session?.user?.email || "demo@streamly.com",
    name: session?.user?.name || "Demo User",
    subscription: {
      status: "active",
      planId: "premium",
      planName: "PREMIUM",
      planSpecs: "Ultra HD 4K + HDR (4 Screens at once)",
      cardLast4: "4242",
      cardBrand: "visa",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    },
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Form States for Email/Password Modals
  const [newEmail, setNewEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch live subscription status from API
    apiRequest<{ data: SubscriptionState }>("/payments/subscription")
      .then((res) => {
        if (res.data) setSubData(res.data);
      })
      .catch(() => {
        // Fallback to local session defaults
      });
  }, []);

  async function handlePlanChange(planId: "mobile" | "standard" | "premium") {
    try {
      const res = await apiRequest<{ data: { subscription: SubscriptionState["subscription"] } }>(
        "/payments/change-plan",
        {
          method: "POST",
          body: JSON.stringify({ planId }),
        }
      );
      if (res.data?.subscription) {
        setSubData((prev) => ({ ...prev, subscription: res.data.subscription }));
      }
    } catch {
      // Local fallback update
      const plan = PLANS.find((p) => p.id === planId);
      if (plan) {
        setSubData((prev) => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            planId: plan.id,
            planName: plan.name.toUpperCase(),
            planSpecs: `${plan.resolution} (${plan.screens})`,
          },
        }));
      }
    }
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setModalMessage(null);
    try {
      await apiRequest("/payments/update-credentials", {
        method: "POST",
        body: JSON.stringify({ email: newEmail }),
      });
      setSubData((prev) => ({ ...prev, email: newEmail }));
      setShowEmailModal(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setModalMessage(null);
    try {
      await apiRequest("/payments/update-credentials", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      setShowPasswordModal(false);
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  const formattedDate = new Date(subData.subscription.currentPeriodEnd).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur-md sm:px-12">
        <div className="flex items-center gap-8">
          <Logo href="/browse" />
          <nav className="hidden items-center gap-5 text-sm text-[#ccc] md:flex">
            <Link to="/browse" className="hover:text-white">Home</Link>
            <Link to="/browse?type=tv" className="hover:text-white">TV Shows</Link>
            <Link to="/browse?type=movie" className="hover:text-white">Movies</Link>
            <Link to="/browse" className="hover:text-white">New & Popular</Link>
            <Link to="/browse#mylist" className="hover:text-white">My List</Link>
          </nav>
        </div>

        <div className="flex items-center gap-5 text-white">
          <button aria-label="Search" className="text-[#ccc] hover:text-white">
            <Search className="size-5" />
          </button>
          <div className="relative">
            <button aria-label="Notifications" className="text-[#ccc] hover:text-white">
              <Bell className="size-5" />
              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#e50914]" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 focus:outline-none"
            >
              <div
                style={{ background: profile?.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                className="grid size-8 place-items-center rounded bg-blue-600 font-bold text-white shadow"
              >
                {profile?.name?.charAt(0) || "A"}
              </div>
              <ChevronDown className="size-4 text-[#aaa]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-48 rounded border border-white/15 bg-black/95 py-2 shadow-2xl backdrop-blur-md">
                <Link
                  to="/profiles"
                  className="block px-4 py-2 text-sm text-[#ccc] hover:bg-white/10 hover:text-white"
                >
                  Switch Profiles
                </Link>
                <Link
                  to="/account"
                  className="block px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Account Settings
                </Link>
                <hr className="my-1 border-white/10" />
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-[#ccc] hover:bg-white/10 hover:text-white"
                >
                  Sign Out of Streamly
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Account</h1>
        <hr className="my-5 border-white/15" />

        {/* ── MEMBERSHIP & BILLING ── */}
        <div className="rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#aaa]">
            <Shield className="size-4 text-[#e50914]" />
            <span>MEMBERSHIP & BILLING</span>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-semibold text-white">{subData.email}</p>
              <p className="mt-1 text-sm text-[#aaa]">Password: ••••••••••••</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailModal(true)}
                className="rounded border border-white/20 bg-[#262626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Change Email
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="rounded border border-white/20 bg-[#262626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Credit Card Row */}
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded bg-emerald-900/40 text-emerald-400">
                <CreditCard className="size-6" />
              </div>
              <div>
                <p className="text-base font-bold tracking-wider text-white">
                  •••• •••• •••• {subData.subscription.cardLast4}
                </p>
                <p className="mt-0.5 text-xs text-[#aaa]">
                  Your next billing date is {formattedDate}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded bg-[#e50914] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#c80710]"
            >
              Manage Payment Info
            </button>
          </div>
        </div>

        {/* ── PLAN DETAILS ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#aaa]">PLAN DETAILS</p>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="rounded bg-[#e50914] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white">
                {subData.subscription.planName}
              </span>
              <p className="text-base font-bold text-white">{subData.subscription.planSpecs}</p>
            </div>

            <button
              onClick={() => setShowPlanModal(true)}
              className="rounded border border-white/20 bg-[#262626] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#333]"
            >
              Change Plan
            </button>
          </div>
        </div>

        {/* ── PROFILES & PARENTAL CONTROLS ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#181818] p-6 shadow-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#aaa]">
            PROFILES & PARENTAL CONTROLS
          </p>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                style={{ background: profile?.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                className="grid size-12 place-items-center rounded bg-blue-600 text-lg font-black text-white shadow"
              >
                {profile?.name?.charAt(0) || "A"}
              </div>
              <div>
                <p className="text-base font-bold text-white">{profile?.name || "Alex"}</p>
                <p className="text-xs text-[#888]">All Maturity Levels • Viewing Restrictions: Off</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/profiles")}
              className="flex items-center gap-1 text-xs font-semibold text-[#aaa] hover:text-white"
            >
              Switch <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── PLAN SELECTION MODAL ── */}
      {showPlanModal && (
        <PlanModal
          currentPlanId={subData.subscription.planId}
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={handlePlanChange}
        />
      )}

      {/* ── MANAGE PAYMENT INFO MODAL (Stripe Elements — PCI-DSS compliant) ── */}
      {showPaymentModal && (
        <StripePaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(sub: SubscriptionData) =>
            setSubData((prev) => ({ ...prev, subscription: sub }))
          }
        />
      )}

      {/* ── CHANGE EMAIL MODAL ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-900/40 p-2.5 text-blue-400">
                <Mail className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Email Address</h3>
                <p className="text-xs text-[#aaa]">Enter your new account email.</p>
              </div>
            </div>

            {modalMessage && (
              <p className="mt-3 rounded border border-red-500/40 bg-red-950/50 p-2.5 text-xs text-red-200">
                {modalMessage}
              </p>
            )}

            <form onSubmit={handleEmailUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ccc]">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  placeholder="newemail@example.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c80710]"
                >
                  {loading ? "Updating..." : "Update Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-900/40 p-2.5 text-amber-400">
                <KeyRound className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="text-xs text-[#aaa]">Update your account password.</p>
              </div>
            </div>

            {modalMessage && (
              <p className="mt-3 rounded border border-red-500/40 bg-red-950/50 p-2.5 text-xs text-red-200">
                {modalMessage}
              </p>
            )}

            <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#ccc]">Current Password</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ccc]">New Password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="mt-1.5 w-full rounded border border-white/20 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="rounded bg-[#e50914] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c80710]"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
