import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getProviders,
  registerUser,
  signIn,
} from "@/lib/mockAuth";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");

  useEffect(() => {
    getProviders().then((data) => setAvailableProviders(Object.keys(data)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");

    if (!/^\S+@\S+\.\S+$/.test(email))
      return setMessage({ type: "error", text: "Enter a valid email address." });
    if (password.length < 8)
      return setMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
    if (
      mode === "register" &&
      (!/[A-Z]/.test(password) || !/\d/.test(password))
    )
      return setMessage({
        type: "error",
        text: "Use at least one uppercase letter and one number.",
      });

    setLoading(true);
    try {
      if (mode === "register") {
        const name = String(data.get("name") ?? "").trim();
        const error = await registerUser(name, email, password);
        if (error) throw new Error(error);
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result.ok) throw new Error(result.error ?? "Email or password is incorrect.");

      setMessage({
        type: "success",
        text:
          mode === "register"
            ? "Account created. Welcome to Streamly!"
            : "Welcome back!",
      });

      // Small delay so the success message is visible before navigating
      setTimeout(() => navigate("/browse"), 700);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    if (!availableProviders.includes(provider)) {
      return setMessage({
        type: "error",
        text: `${
          provider === "google" ? "Google" : "GitHub"
        } login is available after its OAuth keys are configured.`,
      });
    }
    setProviderLoading(provider);
    await signIn(provider, { callbackUrl: "/browse" });
    setProviderLoading(null);
  }

  return (
    <div className="w-full max-w-[450px] rounded-md bg-black/80 px-6 py-9 shadow-2xl backdrop-blur-sm sm:px-14 sm:py-12">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Sign In" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-[#aaa]">
        {mode === "login"
          ? "Welcome back. Your next story awaits."
          : "Unlimited entertainment starts here."}
      </p>

      {message && (
        <div
          role="alert"
          className={`mt-5 flex items-start gap-2 rounded border px-3 py-2.5 text-sm ${
            message.type === "error"
              ? "border-red-500/40 bg-red-950/50 text-red-100"
              : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="sr-only">Name</span>
            <input
              name="name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
            />
          </label>
        )}
        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Password</span>
          <input
            name="password"
            required
            minLength={8}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password"
            className="w-full rounded border border-white/25 bg-[#161616]/80 px-4 py-4 pr-12 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </label>
        {mode === "register" && (
          <p className="text-xs leading-relaxed text-[#999]">
            At least 8 characters with one uppercase letter and one number.
          </p>
        )}
        <button
          disabled={loading}
          className="flex w-full items-center justify-center rounded bg-[#e50914] py-3 font-semibold hover:bg-[#c80710] disabled:opacity-60"
        >
          {loading && <LoaderCircle className="mr-2 size-4 animate-spin" />}
          {mode === "login" ? "Sign In" : "Get Started"}
        </button>
        {mode === "login" && (
          <div className="flex items-center justify-between text-xs text-[#aaa]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="accent-[#e50914]"
              />
              Remember me
            </label>
            <Link to="#" className="hover:text-white hover:underline">
              Need help?
            </Link>
          </div>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[#777]">
        <span className="h-px flex-1 bg-white/15" />
        OR
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => oauth("google")}
          disabled={Boolean(providerLoading)}
          className="flex w-full items-center justify-center gap-3 rounded border border-white/25 bg-white px-4 py-3 text-sm font-semibold text-[#171717] hover:bg-[#e8e8e8]"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"/>
            <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.15A11 11 0 0 0 1 12c0 1.77.42 3.44 1.15 4.93l3.69-2.84Z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.55 4.21 1.64l3.15-3.15A10.55 10.55 0 0 0 12 1 11 11 0 0 0 2.15 7.07l3.69 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
          </svg>
          {providerLoading === "google" ? "Connecting…" : "Continue with Google"}
        </button>

        <button
          onClick={() => oauth("github")}
          disabled={Boolean(providerLoading)}
          className="flex w-full items-center justify-center gap-3 rounded border border-white/25 bg-[#24292f] px-4 py-3 text-sm font-semibold hover:bg-[#30363d]"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.24.7-3.92-1.37-3.92-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.58-.3-5.3-1.29-5.3-5.7 0-1.27.46-2.3 1.2-3.1-.12-.3-.52-1.48.11-3.07 0 0 .98-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.6.23 2.78.11 3.07.75.8 1.2 1.83 1.2 3.1 0 4.43-2.72 5.4-5.31 5.69.42.36.79 1.07.79 2.16v3.2c0 .32.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
          </svg>
          {providerLoading === "github" ? "Connecting…" : "Continue with GitHub"}
        </button>
      </div>

      <p className="mt-7 text-sm text-[#aaa]">
        {mode === "login" ? "New to Streamly?" : "Already have an account?"}{" "}
        <Link
          to={mode === "login" ? "/register" : "/login"}
          className="font-semibold text-white hover:underline"
        >
          {mode === "login" ? "Sign up now" : "Sign in"}
        </Link>
      </p>
      <p className="mt-5 text-[11px] leading-relaxed text-[#777]">
        Protected by modern security controls. By continuing, you agree to our
        Terms of Use and Privacy Statement.
      </p>
    </div>
  );
}
