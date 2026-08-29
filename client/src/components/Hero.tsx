import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Info, Play, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { imageUrl, mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

interface HeroProps {
  media: MediaItem;
  items?: MediaItem[];
}

export function Hero({ media, items }: HeroProps) {
  const { openMedia } = useApp();

  const candidates = useMemo(() => {
    if (items && items.length >= 3) return items.slice(0, 5);
    return null;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeMedia = candidates ? candidates[activeIndex] : media;

  const resetAndStartSlide = useCallback(() => {
    setSlideProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const stepMs = 50;
    const totalMs = 8000;
    progressIntervalRef.current = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (stepMs / totalMs) * 100;
      });
    }, stepMs);

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (candidates?.length || 1));
      setSlideProgress(0);
    }, totalMs);
  }, [candidates]);

  useEffect(() => {
    if (!candidates || isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }
    resetAndStartSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [candidates, isHovered, activeIndex, resetAndStartSlide]);

  const maturityRating = useMemo(() => {
    if (activeMedia.adult) return "18+";
    if (activeMedia.genre_ids?.some((id) => [27, 80, 53].includes(id))) return "18+";
    if (activeMedia.genre_ids?.some((id) => [16, 10751].includes(id))) return "U/A 7+";
    if (activeMedia.genre_ids?.some((id) => [35, 12].includes(id))) return "13+";
    return "16+";
  }, [activeMedia]);

  const tagLabel = useMemo(() => {
    if (activeMedia.media_type === "tv" || activeMedia.first_air_date) return "SERIES PREMIERE";
    if (activeMedia.vote_average && activeMedia.vote_average >= 8.3) return "BLOCKBUSTER HIT";
    return "TOP TRENDING";
  }, [activeMedia]);

  // Subtle 3D mouse parallax handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section
      className="relative pt-20 px-4 sm:pt-24 sm:px-[4vw] pb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Ambient Reactive Diffuse Bloom behind Hero Container */}
      <div className="pointer-events-none absolute -inset-x-8 -top-10 bottom-0 flex items-center justify-center overflow-hidden opacity-60">
        <motion.div
          key={`ambient-${activeMedia.id}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="size-[550px] rounded-full bg-gradient-to-r from-[#e50914]/25 via-[#ff3b30]/15 to-transparent blur-[140px]"
        />
      </div>

      <div className="relative h-[68vh] min-h-[500px] w-full overflow-hidden rounded-2xl border border-white/20 bg-[#181818] shadow-[0_25px_70px_rgba(0,0,0,0.98)] sm:h-[78vh] sm:min-h-[580px]">
        {/* Parallax Backdrop Image */}
        <AnimatePresence mode="sync">
          <motion.div
            key={activeMedia.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: mousePos.x * -16,
              y: mousePos.y * -16,
            }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{
              opacity: { duration: 0.8 },
              scale: { duration: 1.2 },
              x: { type: "spring", stiffness: 100, damping: 20 },
              y: { type: "spring", stiffness: 100, damping: 20 },
            }}
            className="absolute inset-0 bg-cover bg-[68%_center] sm:bg-center"
            style={{ backgroundImage: `url(${imageUrl(activeMedia.backdrop_path, "original")})` }}
          />
        </AnimatePresence>

        <div className="hero-vignette absolute inset-0 rounded-2xl" />

        {/* Foreground Content */}
        <motion.div
          key={`content-${activeMedia.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            x: mousePos.x * 12,
          }}
          transition={{
            opacity: { delay: 0.15, duration: 0.55 },
            y: { delay: 0.15, duration: 0.55 },
            x: { type: "spring", stiffness: 120, damping: 22 },
          }}
          className="absolute bottom-[12%] left-0 z-10 max-w-2xl px-6 sm:bottom-[14%] sm:px-10"
        >
          {/* Top Series / Trending Badge */}
          <div className="mb-3 flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.25em] text-[#e5e5e5]">
              <span className="text-xl font-black tracking-[-.1em] text-[#e50914] drop-shadow-[0_0_12px_rgba(229,9,20,0.8)]">
                S
              </span>{" "}
              {tagLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              <Sparkles className="size-3" /> 4K ULTRA HD
            </span>
          </div>

          <h1 className="max-w-xl text-balance text-4xl font-black leading-[.95] tracking-[-.04em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-6xl lg:text-7xl">
            {mediaTitle(activeMedia)}
          </h1>

          <p className="mt-5 line-clamp-3 max-w-xl text-sm font-medium leading-relaxed text-white/90 drop-shadow-lg sm:text-base lg:text-lg">
            {activeMedia.overview}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/watch?id=${activeMedia.id}&title=${encodeURIComponent(mediaTitle(activeMedia))}`}
              state={{ media: activeMedia }}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] transition-all duration-200 hover:bg-white/85 hover:scale-105 active:scale-95 sm:px-8 sm:py-3 sm:text-base"
            >
              <Play className="size-5 fill-current" /> Play
            </Link>
            <button
              onClick={() => openMedia(activeMedia)}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-[#6d6d6e]/70 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-md shadow-lg transition-all duration-200 hover:bg-[#6d6d6e]/50 hover:scale-105 active:scale-95 sm:px-8 sm:py-3 sm:text-base"
            >
              <Info className="size-5" /> More Info
            </button>
          </div>
        </motion.div>

        {/* Dynamic Maturity Rating & Dolby Atmos Badges */}
        <div className="absolute bottom-8 right-0 hidden items-center gap-2 rounded-l-xl border-y border-l border-white/20 bg-black/60 py-2.5 pl-4 pr-6 backdrop-blur-md sm:flex">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            DOLBY VISION • ATMOS
          </span>
          <div className="h-3 w-px bg-white/20" />
          <span className="text-xs font-black text-white">{maturityRating}</span>
        </div>

        {/* Progressive Filling Carousel Timer Bars */}
        {candidates && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            {candidates.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveIndex(i);
                  resetAndStartSlide();
                }}
                aria-label={`Go to featured title ${i + 1}`}
                className="group relative h-1.5 w-8 sm:w-10 overflow-hidden rounded-full bg-white/20 transition-all hover:bg-white/40"
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    i === activeIndex
                      ? "bg-[#e50914] shadow-[0_0_10px_#e50914]"
                      : i < activeIndex
                      ? "bg-white/70"
                      : "w-0"
                  }`}
                  style={{
                    width: i === activeIndex ? `${slideProgress}%` : undefined,
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
