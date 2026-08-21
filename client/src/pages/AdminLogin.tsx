import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";
import { adminLogin, isAdminAuthenticated } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickFillSuccess, setShowQuickFillSuccess] = useState(false);

  // If already authenticated as admin, redirect directly to /admin
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleQuickFill = () => {
    setAdminId("admin@streamly.com");
    setPassword("AdminPassword123");
    setError(null);
    setShowQuickFillSuccess(true);
    setTimeout(() => setShowQuickFillSuccess(false), 2500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !password.trim()) {
      setError("Please provide both Admin ID and Password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Artificial short delay for authentic feedback
    await new Promise((r) => setTimeout(r, 450));

    const result = await adminLogin(adminId, password, rememberMe);
    setIsLoading(false);

    if (result.ok) {
      const from = (location.state as { from?: string })?.from || "/admin";
      navigate(from, { replace: true });
    } else {
      setError(result.error || "Authentication failed. Invalid Admin ID or password.");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-x-hidden">
      {/* Ambient Red Studio Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-[#e50914]/15 blur-[160px]" />
        <div className="absolute bottom-10 right-10 size-[400px] rounded-full bg-red-950/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-6">
        <Link
          to="/browse"
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Streamly</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-red-950/60 border border-red-800/50 text-red-400 uppercase">
            <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
            Restricted Area
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[460px] my-auto"
      >
        <div className="rounded-3xl border border-white/15 bg-black/85 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Top Crimson Accent Border */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#e50914] to-transparent" />

          {/* Logo & Shield Icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 grid place-items-center shadow-lg shadow-red-900/40 border border-red-400/30">
                <Shield className="size-8 text-white stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#141414] border border-white/20 grid place-items-center">
                <Lock className="size-2.5 text-red-400" />
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Streamly <span className="text-[#e50914]">Admin</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Administrative Control & Management Console
            </p>
          </div>

          {/* Quick Fill Demo Helper Pill */}
          <div className="mb-6 rounded-2xl bg-white/[0.04] border border-white/10 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <KeyRound className="size-4 text-amber-400 shrink-0" />
                <span className="text-[11px] leading-tight">
                  Backend Admin: <strong className="text-white">admin@streamly.com</strong> / <strong className="text-white">AdminPassword123</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all shrink-0 flex items-center gap-1"
              >
                {showQuickFillSuccess ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    <span>Filled!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3" />
                    <span>Auto-Fill</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-950/60 border border-red-700/60 p-3.5 text-xs text-red-200"
              >
                <AlertCircle className="size-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Admin ID Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 tracking-wide">
                Admin ID / Email
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 size-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter admin ID or email"
                  required
                  autoFocus
                  className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#e50914] focus:bg-white/[0.1] focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 tracking-wide">
                Admin Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-3 pl-10 pr-11 text-sm text-white placeholder:text-gray-500 focus:border-[#e50914] focus:bg-white/[0.1] focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded bg-white/10 border-white/20 text-[#e50914] focus:ring-0 focus:ring-offset-0 accent-[#e50914]"
                />
                <span>Keep session active</span>
              </label>

              <span className="text-[11px] text-gray-500 font-mono">ID: admin</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-xl bg-[#e50914] hover:bg-[#ff151f] text-white py-3 px-4 text-sm font-bold tracking-wide transition-all duration-200 shadow-lg shadow-red-950/50 hover:shadow-red-700/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="size-4" />
                  <span>Authenticate & Enter</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Protected by Streamly Admin Guard. Unauthorized access attempts are monitored and logged.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl py-6 text-center text-xs text-gray-600">
        Streamly Video Operations &copy; {new Date().getFullYear()} &bull; Admin Console v2.4
      </footer>
    </div>
  );
}
