import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Languages,
  MonitorPlay,
  Sparkles,
  TabletSmartphone,
} from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Logo } from "@/components/Logo";
import type { FormEvent } from "react";

export default function HomePage() {
  const navigate = useNavigate();

  function handleGetStarted(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    navigate(`/register${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative min-h-[700px] border-b-8 border-[#232323] bg-[url('https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg')] bg-cover bg-center sm:min-h-[760px]">
        <div className="landing-vignette absolute inset-0" />
        <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="relative hidden sm:block">
              <Languages className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <select
                aria-label="Language"
                className="rounded border border-white/50 bg-black/50 py-1.5 pl-9 pr-3 text-sm font-medium outline-none"
              >
                <option>English</option>
                <option>Español</option>
              </select>
            </label>
            <Link
              to="/login"
              className="rounded bg-[#e50914] px-4 py-2 text-sm font-semibold hover:bg-[#c80710]"
            >
              Sign In
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[600px] max-w-4xl flex-col items-center justify-center px-5 pb-10 pt-16 text-center">
          <span className="mb-5 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="mr-1.5 inline size-3.5 text-[#e50914]" />
            STORIES SELECTED FOR YOU
          </span>
          <h1 className="text-balance text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            Unlimited movies, series, and more.
          </h1>
          <p className="mt-6 text-lg font-medium sm:text-xl">
            Watch anywhere. Cancel anytime.
          </p>
          <p className="mt-7 text-sm text-[#eee] sm:text-base">
            Ready to watch? Enter your email to create or restart your
            membership.
          </p>
          <form
            onSubmit={handleGetStarted}
            className="mt-4 flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
          >
            <input
              required
              name="email"
              type="email"
              aria-label="Email address"
              placeholder="Email address"
              className="min-h-14 flex-1 rounded border border-white/60 bg-black/55 px-4 text-base outline-none backdrop-blur-sm placeholder:text-[#bbb] focus:border-white focus:ring-2 focus:ring-white/20"
            />
            <button className="mx-auto flex min-h-14 items-center justify-center rounded bg-[#e50914] px-6 text-lg font-bold hover:bg-[#c80710] sm:mx-0 sm:text-xl">
              Get Started <ChevronRight className="ml-2 size-6" />
            </button>
          </form>
        </div>
      </section>

      {/* ── Feature 1: Multi-device ── */}
      <section className="border-b-8 border-[#232323] px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#e50914]">
              Made for your screen
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Your stories. Everywhere.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#c7c7c7]">
              Watch on smart TVs, game consoles, phones, tablets, and browsers.
              Pick up exactly where you left off.
            </p>
          </div>
          <div className="relative mx-auto aspect-video w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2c0b0d] via-[#171717] to-black shadow-[0_30px_90px_rgba(229,9,20,.18)]">
            <div className="absolute inset-5 rounded-xl border border-white/10 bg-[url('https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg')] bg-cover bg-center">
              <span className="absolute bottom-3 left-3 rounded bg-[#e50914] px-2 py-1 text-[10px] font-bold">
                NOW PLAYING
              </span>
            </div>
            <MonitorPlay className="absolute right-2 top-2 size-7 text-white/60" />
          </div>
        </div>
      </section>

      {/* ── Feature 2: Download ── */}
      <section className="border-b-8 border-[#232323] px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="relative mx-auto flex h-72 w-72 items-center justify-center rounded-full bg-[radial-gradient(circle,#43070a_0%,#170405_55%,#050505_72%)] sm:h-96 sm:w-96">
            <TabletSmartphone className="size-40 text-[#e50914] drop-shadow-[0_0_28px_rgba(229,9,20,.5)] sm:size-56" />
            <div className="absolute bottom-2 rounded-xl border border-white/15 bg-[#181818] px-5 py-3 shadow-xl">
              <p className="text-sm font-bold">Downloads ready</p>
              <p className="text-xs text-[#46a8ff]">Watch offline anytime</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-[#e50914]">
              Take it with you
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Download and go.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#c7c7c7]">
              Save your favorites easily and always have something brilliant to
              watch, even without a connection.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-b-8 border-[#232323] px-5 py-16 sm:py-24">
        <h2 className="text-center text-3xl font-black sm:text-5xl">
          Frequently Asked Questions
        </h2>
        <FAQ />
        <div className="mt-12 text-center">
          <p className="text-[#ddd]">Ready to start watching?</p>
          <Link
            to="/register"
            className="mt-4 inline-flex items-center rounded bg-[#e50914] px-6 py-3 font-bold hover:bg-[#c80710]"
          >
            Create your account <ChevronRight className="ml-1 size-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto max-w-6xl px-6 py-14 text-sm text-[#888]">
        <p>Questions? Contact us.</p>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link to="#">FAQ</Link>
          <Link to="#">Help Center</Link>
          <Link to="#">Terms of Use</Link>
          <Link to="#">Privacy</Link>
          <Link to="#">Cookie Preferences</Link>
          <Link to="#">Corporate Information</Link>
        </div>
        <p className="mt-10 text-xs">
          Streamly — a portfolio streaming experience.
        </p>
      </footer>
    </main>
  );
}
