import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Check, Play, Plus, ThumbsUp, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/components/AppProvider";
import { imageUrl, mediaTitle, mediaYear } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getVideoById } from "@/lib/videoCatalog";

// Mock genre lookup for rich popup tags
const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
};

// Netflix-style 3D animated Top 10 rank typography overlay (1 to 10)
function Top10RankNumber({ rank, isHovered }: { rank: number; isHovered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2, rotateY: -90, y: 40, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, scale: 1, rotateY: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-30px" }}
      animate={
        isHovered
          ? {
              scale: 1.25,
              x: -10,
              y: -8,
              rotateZ: -4,
              filter: "drop-shadow(0 0 25px rgba(229,9,20,0.85)) brightness(1.35)",
            }
          : {
              scale: 1,
              x: 0,
              y: 0,
              rotateZ: 0,
              filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.95)) brightness(1)",
            }
      }
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: Math.min((rank - 1) * 0.07, 0.6),
      }}
      className={`absolute bottom-[-10%] -left-3 sm:-left-5 md:-left-7 z-20 shrink-0 select-none pointer-events-none flex items-end justify-center font-black italic tracking-tighter text-[95px] sm:text-[130px] md:text-[160px] leading-none transition-opacity duration-200 ${
        isHovered ? "opacity-0" : "opacity-100"
      }`}
      style={{
        WebkitTextStroke: "5px #000000",
        color: "#ffffff",
        perspective: "1000px",
      }}
    >
      <motion.span
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: rank * 0.2,
        }}
        className="bg-gradient-to-b from-[#ffffff] via-[#f0f0f0] to-[#777777] bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
      >
        {rank}
      </motion.span>
    </motion.div>
  );
}

function MovieCard({
  media,
  rank,
}: {
  media: MediaItem;
  rank?: number;
}) {
  const { openMedia, selectedMedia, myList, toggleList } = useApp();
  const listed = myList.includes(media.id);

  const cardRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(true);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoUrl = useMemo(() => {
    const item = getVideoById(media.id);
    return item?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  }, [media.id]);

  const handleOpenMedia = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (trailerTimer.current) clearTimeout(trailerTimer.current);
    setIsHovered(false);
    setIsPlayingTrailer(false);
    openMedia(media);
  };

  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (trailerTimer.current) clearTimeout(trailerTimer.current);
    // Don't open hover popup if InfoModal is currently open
    if (selectedMedia) return;

    // 260ms hover delay prevents accidental popups when scrolling fast past cards
    hoverTimer.current = setTimeout(() => {
      const targetEl = posterRef.current ?? cardRef.current;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setIsHovered(true);

        // Start video preview after 1.2s of hovering on the card
        trailerTimer.current = setTimeout(() => {
          setIsPlayingTrailer(true);
        }, 1200);
      }
    }, 260);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (trailerTimer.current) clearTimeout(trailerTimer.current);
    hoverTimer.current = setTimeout(() => {
      setIsHovered(false);
      setIsPlayingTrailer(false);
    }, 120);
  };

  // Close popup instantly if selectedMedia (InfoModal) is open or on any scroll event
  useEffect(() => {
    if (selectedMedia) {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (trailerTimer.current) clearTimeout(trailerTimer.current);
      setIsHovered(false);
      setIsPlayingTrailer(false);
    }
  }, [selectedMedia]);

  useEffect(() => {
    const handleScroll = () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (trailerTimer.current) clearTimeout(trailerTimer.current);
      setIsHovered(false);
      setIsPlayingTrailer(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (trailerTimer.current) clearTimeout(trailerTimer.current);
    };
  }, []);

  const genreNames = (media.genre_ids ?? [])
    .slice(0, 3)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

  // Compute transform origin and positioning to prevent screen edge clipping
  let originClass = "origin-center";
  if (coords) {
    const screenWidth = window.innerWidth;
    if (coords.left < 80) {
      originClass = "origin-left";
    } else if (screenWidth - (coords.left + coords.width) < 80) {
      originClass = "origin-right";
    }
  }

  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setCardTilt({ x, y });
  };

  const handleCardMouseLeaveRest = () => {
    setCardTilt({ x: 0, y: 0 });
    handleMouseLeave();
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-end shrink-0 ${
        rank
          ? "w-[74vw] sm:w-[42vw] md:w-[32vw] lg:w-[24vw] xl:w-[20vw] ml-3 sm:ml-4"
          : "w-[68vw] sm:w-[38vw] md:w-[29vw] lg:w-[22vw] xl:w-[18vw]"
      }`}
    >
      {/* Base resting card poster with 3D perspective tilt & specular sheen */}
      <button
        ref={posterRef}
        onClick={handleOpenMedia}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeaveRest}
        style={{
          transform: `perspective(700px) rotateX(${cardTilt.y}deg) rotateY(${cardTilt.x}deg)`,
          transition: "transform 150ms ease-out, opacity 200ms ease",
        }}
        className={`group block w-full text-left transition-opacity duration-200 ${
          isHovered ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="relative aspect-video overflow-hidden rounded-xl bg-[#252525] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-white/30 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.95)]">
          <img
            src={imageUrl(media.backdrop_path)}
            alt={mediaTitle(media)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dynamic Glare / Specular Sheen sweep */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />

          {/* Subtle Bottom Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

          <p className="absolute bottom-2 left-2.5 right-2.5 truncate text-[11px] font-bold text-white drop-shadow-md">
            {mediaTitle(media)}
          </p>
        </div>
      </button>

      {/* Netflix Top 10 Animated Rank Number OVER the movie card */}
      {rank && <Top10RankNumber rank={rank} isHovered={isHovered} />}

      {/* Floating Pop-up detail card rendered via Portal onto document.body so it NEVER gets cut off */}
      {isHovered && coords &&
        createPortal(
          <div
            className="fixed z-[99999] pointer-events-auto"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 0 }}
                animate={{ opacity: 1, scale: 1.25, y: -20 }}
                exit={{ opacity: 0, scale: 0.95, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`w-full rounded-xl bg-[#181818] border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.98)] overflow-hidden ${originClass}`}
              >
                {/* Top Backdrop Image or Auto-Playing Trailer Video */}
                <div
                  className="relative aspect-video w-full cursor-pointer overflow-hidden bg-[#252525]"
                  onClick={handleOpenMedia}
                >
                  <img
                    src={imageUrl(media.backdrop_path)}
                    alt={mediaTitle(media)}
                    className="h-full w-full object-cover"
                  />

                  {/* Auto-playing Trailer Video Overlay */}
                  {isPlayingTrailer && videoUrl && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-10 bg-black"
                    >
                      <video
                        src={videoUrl}
                        autoPlay
                        muted={isTrailerMuted}
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTrailerMuted((m) => !m);
                        }}
                        className="absolute bottom-2 right-2 z-20 grid size-6 place-items-center rounded-full bg-black/70 border border-white/20 text-white/80 hover:text-white transition shadow-lg"
                        title={isTrailerMuted ? "Unmute Trailer" : "Mute Trailer"}
                      >
                        {isTrailerMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                      </button>
                    </motion.div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent opacity-90 z-20 pointer-events-none" />
                  {rank && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded bg-[#e50914] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md pointer-events-none">
                      TOP #{rank}
                    </div>
                  )}
                  <h3 className="absolute bottom-2 left-3 right-3 z-20 text-xs font-bold line-clamp-1 drop-shadow-md pointer-events-none">
                    {mediaTitle(media)}
                  </h3>
                </div>

                {/* Bottom Details & Controls */}
                <div className="p-3.5 space-y-2.5">
                  {/* Action Buttons Row with Ultra-Smooth Spring Transitions */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/watch?id=${media.id}&title=${encodeURIComponent(mediaTitle(media))}`}
                      state={{ media }}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-md hover:bg-white/80 transition-all active:scale-95"
                      aria-label="Play"
                      title="Play"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>Play</span>
                    </Link>

                    <motion.button
                      whileHover={{ scale: 1.15, borderColor: "rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.15)" }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => toggleList(media.id)}
                      className="grid size-7 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm shadow-md"
                      aria-label={listed ? "Remove from list" : "Add to list"}
                      title={listed ? "Remove from My List" : "Add to My List"}
                    >
                      {listed ? <Check className="size-3.5 text-[#46d369]" /> : <Plus className="size-3.5" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.15, borderColor: "rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.15)" }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="grid size-7 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm shadow-md"
                      aria-label="I like this"
                      title="I like this"
                    >
                      <ThumbsUp className="size-3" />
                    </motion.button>

                    {/* Ultra-smooth More Info down arrow button with spring scale & downward arrow shift */}
                    <motion.button
                      whileHover={{ scale: 1.18, y: 1, borderColor: "rgba(255,255,255,0.95)", backgroundColor: "rgba(255,255,255,0.22)" }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={handleOpenMedia}
                      className="ml-auto grid size-7 place-items-center rounded-full border border-white/40 bg-black/40 text-white shadow-md backdrop-blur-sm"
                      aria-label="More information"
                      title="More Info"
                    >
                      <motion.div
                        whileHover={{ y: 2.5 }}
                        transition={{ type: "spring", stiffness: 350, damping: 18 }}
                      >
                        <ChevronDown className="size-4" />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Metadata Badges with Metallic Sheen */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#aaa]">
                    <span className="font-bold text-[#46d369]">
                      {Math.min(98, Math.round((media.vote_average ?? 7) * 10))}% Match
                    </span>
                    <span className="rounded border border-white/30 px-1.5 py-0.2 text-[10px] text-white">
                      {media.adult ? "18+" : "13+"}
                    </span>
                    <span>{mediaYear(media)}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-black uppercase text-white tracking-wider">
                      4K HDR
                    </span>
                    <span className="rounded border border-amber-400/40 bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                      ATMOS
                    </span>
                  </div>

                  {/* Genre Pills */}
                  {genreNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#ccc] font-medium">
                      {genreNames.map((g, i) => (
                        <span key={g} className="flex items-center gap-1.5">
                          {i > 0 && <span className="size-1 rounded-full bg-[#666]" />}
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
    </div>
  );
}

export function MovieRow({
  title,
  items,
  ranked = false,
}: {
  title: string;
  items: MediaItem[];
  ranked?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);

  function scroll(direction: number) {
    const amount = ref.current?.clientWidth ?? 600;
    ref.current?.scrollBy({ left: direction * amount * 0.85, behavior: "smooth" });
    setPosition((value) => Math.max(0, value + direction));
  }

  return (
    <section className="group/row relative mb-6 sm:mb-8">
      <div className="mb-2.5 flex items-center px-5 sm:px-[4vw]">
        <h2 className="text-lg font-bold sm:text-xl text-white tracking-wide">{title}</h2>
      </div>

      <div className="relative">
        {/* Left Scroll Arrow */}
        <button
          onClick={() => scroll(-1)}
          className={`absolute bottom-0 left-0 top-0 z-40 w-10 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100 sm:w-[4vw] rounded-r-md ${
            position === 0 ? "pointer-events-none !opacity-0" : ""
          }`}
          aria-label="Previous titles"
        >
          <ChevronLeft className="size-8 text-white" />
        </button>

        {/* Card Horizontal Scroll Row */}
        <div
          ref={ref}
          id={title === "My List" ? "my-list" : undefined}
          className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 py-3 sm:gap-3 sm:px-[4vw]"
        >
          {items.map((media, index) => (
            <MovieCard
              key={`${title}-${media.id}-${index}`}
              media={media}
              rank={ranked && index < 10 ? index + 1 : undefined}
            />
          ))}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => scroll(1)}
          className="absolute bottom-0 right-0 top-0 z-40 w-10 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 transition-opacity hover:bg-black/80 group-hover/row:opacity-100 sm:w-[4vw] rounded-l-md"
          aria-label="Next titles"
        >
          <ChevronRight className="size-8 text-white" />
        </button>
      </div>
    </section>
  );
}
