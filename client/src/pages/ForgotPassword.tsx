import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Mail, CheckCircle, KeyRound, Lock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Step = "request" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/auth/forgot-password-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-[500px] rounded-full bg-[#e50914]/8 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link to="/login" className="mb-8 flex items-center gap-2 text-sm text-[#aaa] transition hover:text-white">
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Link>

        <AnimatePresence mode="wait">
          {/* STEP 1: Enter Email */}
          {step === "request" && (
            <motion.div key="request" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-6 flex flex-col items-start gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#e50914]/10 border border-[#e50914]/20">
                    <Mail className="size-6 text-[#e50914]" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mt-2">Reset Password</h1>
                  <p className="text-sm text-[#888] leading-relaxed">
                    Enter your email address and we will dispatch a 6-digit OTP via email.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fp-email" className="text-xs font-semibold uppercase tracking-wider text-[#888]">Email Address</label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#e50914] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#c11119] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Send Verification OTP"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Enter OTP */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-6 flex flex-col items-start gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#e50914]/10 border border-[#e50914]/20">
                    <KeyRound className="size-6 text-[#e50914]" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mt-2">Enter OTP Code</h1>
                  <p className="text-sm text-[#888] leading-relaxed">
                    We sent a 6-digit OTP code to <span className="font-semibold text-white">{email}</span>. Check your inbox or terminal console.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fp-otp" className="text-xs font-semibold uppercase tracking-wider text-[#888]">6-Digit OTP Code</label>
                    <input
                      id="fp-otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white placeholder-[#555] outline-none transition focus:border-[#e50914]"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#e50914] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#c11119] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="text-xs text-[#888] hover:text-white hover:underline text-center"
                  >
                    Resend Code or Change Email
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Enter New Password */}
          {step === "password" && (
            <motion.div key="password" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-6 flex flex-col items-start gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#e50914]/10 border border-[#e50914]/20">
                    <Lock className="size-6 text-[#e50914]" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mt-2">New Password</h1>
                  <p className="text-sm text-[#888] leading-relaxed">
                    Create a strong new password for your Streamly account.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fp-newpass" className="text-xs font-semibold uppercase tracking-wider text-[#888]">New Password</label>
                    <input
                      id="fp-newpass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition focus:border-[#e50914]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fp-confirmpass" className="text-xs font-semibold uppercase tracking-wider text-[#888]">Confirm Password</label>
                    <input
                      id="fp-confirmpass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      minLength={8}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition focus:border-[#e50914]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#e50914] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#c11119] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Save New Password"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success Screen */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="rounded-2xl border border-[#46d369]/20 bg-[#1a1a1a]/80 p-8 text-center backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-4 grid size-16 place-items-center rounded-full bg-[#46d369]/10 border border-[#46d369]/20 mx-auto">
                  <CheckCircle className="size-8 text-[#46d369]" />
                </div>
                <h1 className="text-xl font-bold">Password Reset Successful</h1>
                <p className="mt-3 text-sm text-[#888] leading-relaxed">
                  Your password for <span className="font-semibold text-white">{email}</span> has been updated. You can now sign in with your new credentials.
                </p>
                <Link to="/login" className="mt-6 block w-full rounded-xl bg-[#e50914] py-3 text-center text-sm font-bold text-white shadow-lg hover:bg-[#c11119]">
                  Return to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
