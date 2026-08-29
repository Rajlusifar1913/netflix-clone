import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
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
          {!submitted ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-8 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-6 flex flex-col items-start gap-2">
                  <div className="grid size-12 place-items-center rounded-xl bg-[#e50914]/10 border border-[#e50914]/20">
                    <Mail className="size-6 text-[#e50914]" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mt-2">Reset Password</h1>
                  <p className="text-sm text-[#888] leading-relaxed">
                    Enter your email address and we will send you a link to reset your password.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#e50914] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#c11119] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <div className="rounded-2xl border border-[#46d369]/20 bg-[#1a1a1a]/80 p-8 text-center backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <div className="mb-4 grid size-16 place-items-center rounded-full bg-[#46d369]/10 border border-[#46d369]/20 mx-auto">
                  <CheckCircle className="size-8 text-[#46d369]" />
                </div>
                <h1 className="text-xl font-bold">Check your email</h1>
                <p className="mt-3 text-sm text-[#888] leading-relaxed">
                  If an account exists for <span className="font-semibold text-white">{email}</span>, we have sent a password reset link. Check your inbox.
                </p>
                <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-[#e50914] transition hover:underline">
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
