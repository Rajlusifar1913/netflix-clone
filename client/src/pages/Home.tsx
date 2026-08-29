import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ChevronRight,
  Languages,
  MonitorPlay,
  Search,
  Sparkles,
  TabletSmartphone,
  ShieldCheck,
  Film,
  Tv,
  Check,
} from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { Logo } from "@/components/Logo";

const HERO_POSTERS_ROW_1 = [
  { title: "Dune: Part Two", path: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { title: "Oppenheimer", path: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { title: "The Dark Knight", path: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Blade Runner 2049", path: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" },
  { title: "Interstellar", path: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
];

const HERO_POSTERS_ROW_2 = [
  { title: "Stranger Things", path: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" },
  { title: "The Last of Us", path: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg" },
  { title: "Arcane", path: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg" },
  { title: "Wednesday", path: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg" },
  { title: "The Bear", path: "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg" },
];

const PRICING_PLANS = [
  {
    id: "standard",
    name: "STANDARD",
    price: "$9.99",
    period: "/mo",
    screens: "1 Screen at once",
    quality: "1080p Full HD",
    popular: false,
    features: [
      "Unlimited movies, series & anime",
      "Stream on phone, tablet & laptop",
      "Full HD 1080p resolution",
      "Cancel or switch plans anytime",
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "$14.99",
    period: "/mo",
    screens: "2 Screens at once",
    quality: "4K Ultra HD + HDR",
    popular: true,
    features: [
      "Everything in Standard",
      "Ultra HD 4K resolution + HDR",
      "Download on up to 2 devices",
      "Dolby Digital 5.1 Surround Audio",
    ],
  },
  {
    id: "ultra",
    name: "ULTRA CINEMA",
    price: "$19.99",
    period: "/mo",
    screens: "4 Screens at once",
    quality: "4K UHD + Dolby Atmos",
    popular: false,
    features: [
      "Everything in Premium",
      "Dolby Vision & Dolby Atmos 3D",
      "Download on up to 6 devices",
      "Exclusive early access releases",
    ],
  },
];

const TRANSLATIONS = {
  English: {
    badge: "PREMIUM CINEMA STREAMING",
    headlinePart1: "UNLIMITED CINEMA.",
    headlinePart2: "ZERO LIMITS.",
    subhead: "Discover unparalleled original series, blockbuster movies, and award-winning documentaries.",
    searchPlaceholder: "Search movies, shows...",
    emailPlaceholder: "Enter email to join",
    getStarted: "Get Started",
    signIn: "Sign In",
    browse: "Browse",
    newReleases: "New Releases",
    tvShows: "TV Shows",
    feat1Badge: "WATCH EVERYWHERE",
    feat1Title: "Stream seamless in 4K HDR",
    feat1Desc: "Watch on Smart TVs, game consoles, phones, tablets, and laptops. Pick up exactly where you left off with zero buffering.",
    feat2Badge: "OFFLINE FREEDOM",
    feat2Title: "Download and watch anywhere",
    feat2Desc: "Save your favorites in crisp 1080p and always have something brilliant to watch, even without internet connection.",
    faqTitle: "Frequently Asked Questions",
    createAccount: "Get Started Today",
  },
  Español: {
    badge: "STREAMING DE CINE PREMIUM",
    headlinePart1: "CINE ILIMITADO.",
    headlinePart2: "SIN LÍMITES.",
    subhead: "Descubre series originales incomparables, películas taquilleras y documentales galardonados.",
    searchPlaceholder: "Buscar películas, series...",
    emailPlaceholder: "Ingresa tu email",
    getStarted: "Comenzar",
    signIn: "Iniciar sesión",
    browse: "Explorar",
    newReleases: "Estrenos",
    tvShows: "Series TV",
    feat1Badge: "DISFRUTA DONDE SEA",
    feat1Title: "Transmisión fluida en 4K HDR",
    feat1Desc: "Disfruta en Smart TVs, consolas, móviles y tablets. Retoma justo donde lo dejaste sin interrupciones.",
    feat2Badge: "LIBERTAD SIN CONEXIÓN",
    feat2Title: "Descarga y mira donde quieras",
    feat2Desc: "Guarda tus títulos favoritos en 1080p para verlos siempre que quieras, incluso sin internet.",
    faqTitle: "Preguntas Frecuentes",
    createAccount: "Comenzar Ahora",
  },
};

export default function HomePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"English" | "Español">(() => {
    try {
      const saved = localStorage.getItem("streamly_lang");
      return saved === "Español" ? "Español" : "English";
    } catch {
      return "English";
    }
  });

  const [searchVal, setSearchVal] = useState("");
  const [emailVal, setEmailVal] = useState("");

  const t = TRANSLATIONS[lang];

  const handleLanguageChange = (newLang: "English" | "Español") => {
    setLang(newLang);
    try {
      localStorage.setItem("streamly_lang", newLang);
    } catch {
      // Ignore
    }
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      return;
    }
    if (emailVal.trim()) {
      navigate(`/register?email=${encodeURIComponent(emailVal.trim())}`);
      return;
    }
    navigate("/register");
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white overflow-x-hidden selection:bg-[#e50914] selection:text-white">
      {/* ── Top Header Navigation ── */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-12 backdrop-blur-sm bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-8">
          <Logo href="/" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#ccc] md:flex">
            <Link to="/browse" className="hover:text-white transition-colors">{t.browse}</Link>
            <Link to="/latest" className="hover:text-white transition-colors">{t.newReleases}</Link>
            <Link to="/tv-shows" className="hover:text-white transition-colors">{t.tvShows}</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <label className="relative hidden sm:block">
            <Languages className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/80" />
            <select
              aria-label="Language selection"
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as "English" | "Español")}
              className="rounded-full border border-white/20 bg-black/60 py-1.5 pl-9 pr-4 text-xs font-semibold outline-none cursor-pointer transition hover:border-white focus:ring-1 focus:ring-white backdrop-blur-md"
            >
              <option value="English">English</option>
              <option value="Español">Español</option>
            </select>
          </label>
          <Link
            to="/login"
            className="rounded-full bg-[#e50914] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c80710] shadow-[0_0_20px_rgba(229,9,20,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            {t.signIn}
          </Link>
        </div>
      </header>

      {/* ── 3D Angled Movie Ribbon Hero Section ── */}
      <section className="relative min-h-[820px] sm:min-h-[900px] flex items-center justify-center overflow-hidden pt-24 pb-20">
        {/* Deep Obsidian Atmosphere: Multi-stop cosmic black background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#050508]" />
        
        {/* Cosmic Ambient Lighting Layers */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(140,5,15,0.28),transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-96 -z-10 bg-[radial-gradient(ellipse_70%_70%_at_50%_100%,rgba(229,9,20,0.2),transparent_70%)]" />
        
        {/* Central Diffuse Crimson Ambient Halo */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[900px] rounded-full bg-gradient-to-tr from-[#e50914]/30 via-[#990000]/18 to-transparent blur-[150px] opacity-90 animate-pulse duration-1000" />

        {/* 3D Angled Movie Ribbon with Specular Reflections & Perspective Matrix */}
        <div
          className="pointer-events-none absolute -inset-x-28 -top-16 bottom-0 -z-0 opacity-55 overflow-hidden flex items-center justify-center"
          style={{
            perspective: "1400px",
          }}
        >
          <div
            className="relative flex flex-col gap-7"
            style={{
              transform: "rotate(-13deg) rotateX(14deg) rotateY(-8deg) scale(1.18)",
              transformOrigin: "center center",
            }}
          >
            {/* Poster Ribbon Row 1 */}
            <div className="flex gap-7">
              {HERO_POSTERS_ROW_1.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative w-44 sm:w-60 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-white/25 bg-[#141418] shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-500"
                >
                  <img
                    src={item.path}
                    alt={item.title}
                    className="h-full w-full object-cover brightness-80 contrast-105"
                  />
                  {/* Glassmorphic Specular Reflection & Light Sweep */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-transparent to-white/20 pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <p className="absolute bottom-3.5 left-3.5 right-3.5 text-xs font-black uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] truncate">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Poster Ribbon Row 2 */}
            <div className="flex gap-7 -ml-32">
              {HERO_POSTERS_ROW_2.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative w-44 sm:w-60 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-white/25 bg-[#141418] shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-500"
                >
                  <img
                    src={item.path}
                    alt={item.title}
                    className="h-full w-full object-cover brightness-80 contrast-105"
                  />
                  {/* Glassmorphic Specular Reflection & Light Sweep */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-transparent to-white/20 pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <p className="absolute bottom-3.5 left-3.5 right-3.5 text-xs font-black uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] truncate">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Depth-of-Field Blur & Cinematic Radial Vignette */}
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[2.5px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050508] via-black/60 to-[#050508]/85" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050508_95%)]" />

        {/* ── Center Hero Content ── */}
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-4 text-center">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-[#e5e5e5] backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <Sparkles className="size-3.5 text-[#e50914]" />
            {t.badge}
          </motion.div>

          {/* Primary Headline: UNLIMITED CINEMA. ZERO LIMITS. */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance font-black tracking-[-0.04em] leading-[0.92] text-5xl sm:text-7xl lg:text-8xl drop-shadow-[0_12px_40px_rgba(0,0,0,0.95)]"
          >
            <span className="block text-white">{t.headlinePart1}</span>
            <span className="block bg-gradient-to-r from-white via-[#f3f3f5] to-[#a0a0aa] bg-clip-text text-transparent">
              {t.headlinePart2}
            </span>
          </motion.h1>

          {/* Subhead with crisp typography */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base sm:text-xl font-medium leading-relaxed text-[#c4c4cc] drop-shadow-md"
          >
            {t.subhead}
          </motion.p>

          {/* ── Unified Glass Pill Input: Single Capsule with Glowing Crimson Action Button ── */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-9 flex w-full max-w-3xl flex-col sm:flex-row items-center rounded-3xl sm:rounded-full border border-white/25 bg-black/45 p-2 sm:p-2.5 backdrop-blur-2xl shadow-[0_10px_50px_rgba(229,9,20,0.32),inset_0_1px_1px_rgba(255,255,255,0.25)] focus-within:border-white/50 focus-within:shadow-[0_10px_60px_rgba(229,9,20,0.55)] transition-all"
          >
            {/* Search Input Field */}
            <div className="relative flex-1 flex items-center w-full px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-white/15">
              <Search className="size-4 text-[#888] mr-3 shrink-0" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-white placeholder-[#777] outline-none"
              />
            </div>

            {/* Email Signup Field */}
            <div className="flex-1 w-full px-4 py-2 sm:py-0">
              <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-white placeholder-[#777] outline-none"
              />
            </div>

            {/* Glowing Crimson "Get Started" Action Button */}
            <button
              type="submit"
              className="mt-2 sm:mt-0 flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-gradient-to-r from-[#e50914] via-[#ea1d27] to-[#b80610] px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_35px_rgba(229,9,20,0.85)] hover:shadow-[0_0_50px_rgba(229,9,20,1)] transition-all hover:scale-105 active:scale-95 hover:brightness-110 shrink-0"
            >
              <span>{t.getStarted}</span>
              <ChevronRight className="size-4" />
            </button>
          </motion.form>

          {/* Right Floating Badges (4K HDR, Dolby Atmos, and Cancel Anytime) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
              4K HDR
            </span>
            <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
              DOLBY VISION & ATMOS
            </span>
            <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-[#aaa] backdrop-blur-md shadow-sm">
              Cancel Anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── Section Divider Line ── */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#e50914]/40 to-transparent" />

      {/* ── Section 2: 3-Tier Frosted Glass Plan Comparison Cards ── */}
      <section className="relative px-6 py-20 sm:py-28 overflow-hidden bg-[#08080a]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#e50914]">
              TRANSPARENT PRICING
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Choose Your Streaming Plan
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#888] max-w-xl mx-auto">
              Switch or cancel anytime. No hidden fees, contracts, or lock-in periods.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] ${
                  plan.popular
                    ? "border-[#e50914] bg-gradient-to-b from-[#e50914]/15 via-black/80 to-black shadow-[0_20px_60px_rgba(229,9,20,0.35)]"
                    : "border-white/15 bg-black/60 hover:border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#e50914] to-[#ff3b30] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-black tracking-wider text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-[#888]">{plan.quality}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-sm font-semibold text-[#888]">{plan.period}</span>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-6 space-y-3">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#ccc]">
                        <Check className="size-4 shrink-0 text-[#e50914]" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/register"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    plan.popular
                      ? "bg-[#e50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.6)] hover:bg-[#c80710]"
                      : "border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section Divider Line ── */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Section 3: Multi-device & 4K UHD ── */}
      <section className="relative px-6 py-20 sm:py-28 overflow-hidden bg-[#0a0a0d]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e50914]/30 bg-[#e50914]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.2em] text-[#e50914]">
              <Tv className="size-3.5" />
              {t.feat1Badge}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              {t.feat1Title}
            </h2>
            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#aaa]">
              {t.feat1Desc}
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-[#ccc]">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#e50914]" /> Smart TVs</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#e50914]" /> Consoles</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#e50914]" /> Phones & Tablets</span>
            </div>
          </div>

          <div className="relative mx-auto aspect-video w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#2c0b0d] via-[#171717] to-black shadow-[0_30px_90px_rgba(229,9,20,.22)] group">
            <div className="absolute inset-4 rounded-xl border border-white/15 bg-[url('https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105">
              <span className="absolute bottom-3 left-3 rounded-md bg-[#e50914] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                NOW STREAMING IN 4K
              </span>
            </div>
            <MonitorPlay className="absolute right-3 top-3 size-7 text-white/70" />
          </div>
        </div>
      </section>

      {/* ── Section Divider Line ── */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#e50914]/40 to-transparent" />

      {/* ── Section 4: Download & Kids Universe ── */}
      <section className="relative px-6 py-20 sm:py-28 overflow-hidden bg-[#08080a]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1 relative mx-auto flex h-72 w-72 items-center justify-center rounded-full bg-[radial-gradient(circle,#43070a_0%,#170405_55%,#050505_72%)] sm:h-96 sm:w-96 shadow-[0_0_80px_rgba(229,9,20,0.3)]">
            <TabletSmartphone className="size-36 text-[#e50914] drop-shadow-[0_0_35px_rgba(229,9,20,.6)] sm:size-52" />
            <div className="absolute bottom-3 rounded-xl border border-white/20 bg-[#181818]/90 px-5 py-3 shadow-2xl backdrop-blur-md">
              <p className="text-sm font-bold text-white">Downloads Ready</p>
              <p className="text-xs text-[#46a8ff] font-medium">Watch offline on plane & road</p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[.2em] text-amber-300">
              <Film className="size-3.5" />
              {t.feat2Badge}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              {t.feat2Title}
            </h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#aaa]">
              {t.feat2Desc}
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-[#ccc]">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-400" /> Kid-Safe Profiles</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-[#e50914]" /> PIN Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Divider Line ── */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#e50914]/40 to-transparent" />

      {/* ── Section 5: FAQ Section ── */}
      <section className="relative px-5 py-20 sm:py-28 bg-[#0a0a0d]">
        <h2 className="text-center text-3xl font-black sm:text-5xl tracking-tight">
          {t.faqTitle}
        </h2>
        <div className="mt-10">
          <FAQ />
        </div>
        <div className="mt-14 text-center">
          <p className="text-base text-[#ccc]">Ready to experience ultimate cinema?</p>
          <Link
            to="/register"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e50914] px-8 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(229,9,20,0.6)] hover:bg-[#c80710] hover:scale-105 active:scale-95 transition-all"
          >
            {t.createAccount} <ChevronRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-black/60 px-6 py-14 text-sm text-[#777]">
        <div className="mx-auto max-w-6xl">
          <p className="font-medium text-[#aaa]">Questions? Contact our 24/7 customer support.</p>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs font-medium">
            <Link to="/help" className="hover:text-white transition">FAQ</Link>
            <Link to="/help" className="hover:text-white transition">Help Center</Link>
            <Link to="/help" className="hover:text-white transition">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/help" className="hover:text-white transition">Cookie Preferences</Link>
            <Link to="/help" className="hover:text-white transition">Corporate Information</Link>
          </div>
          <p className="mt-10 text-xs text-[#555]">
            © 2026 Streamly Inc. All rights reserved. Ultra HD, Dolby Atmos, and 4K HDR are trademarks of their respective owners.
          </p>
        </div>
      </footer>
    </main>
  );
}


