import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Info, Play } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { imageUrl, mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

export function Hero({ media }: { media: MediaItem }) {
  const { openMedia } = useApp();
  return (
    <section className="relative pt-20 px-4 sm:pt-24 sm:px-[4vw] pb-4">
      <div className="relative h-[68vh] min-h-[500px] w-full overflow-hidden rounded-2xl border border-white/20 bg-[#181818] shadow-[0_25px_60px_rgba(0,0,0,0.95)] sm:h-[78vh] sm:min-h-[580px]">
        <motion.div
          initial={{ scale: 1.05, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4 }}
          className="absolute inset-0 bg-cover bg-[68%_center] sm:bg-center"
          style={{ backgroundImage: `url(${imageUrl(media.backdrop_path, "original")})` }}
        />
        <div className="hero-vignette absolute inset-0 rounded-2xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
          className="absolute bottom-[12%] left-0 z-10 max-w-2xl px-6 sm:bottom-[15%] sm:px-10"
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-[#e5e5e5]">
            <span className="text-xl font-black tracking-[-.1em] text-[#e50914]">S</span> SERIES PREMIERE
          </p>
          <h1 className="max-w-xl text-balance text-4xl font-black leading-[.95] tracking-[-.04em] drop-shadow-2xl sm:text-6xl lg:text-7xl">
            {mediaTitle(media)}
          </h1>
          <p className="mt-5 line-clamp-3 max-w-xl text-sm font-medium leading-relaxed text-white drop-shadow-lg sm:text-base lg:text-lg">
            {media.overview}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/watch?id=${media.id}`}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black shadow-lg transition-all duration-200 hover:bg-white/80 sm:px-8 sm:py-3 sm:text-base"
            >
              <Play className="size-5 fill-current" /> Play
            </Link>
            <button
              onClick={() => openMedia(media)}
              className="flex items-center gap-2 rounded-full bg-[#6d6d6e]/80 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-sm shadow-lg transition-all duration-200 hover:bg-[#6d6d6e]/55 sm:px-8 sm:py-3 sm:text-base"
            >
              <Info className="size-5" /> More Info
            </button>
          </div>
        </motion.div>
        <div className="absolute bottom-8 right-0 hidden border-l-2 border-white bg-black/45 py-2 pl-4 pr-6 text-sm rounded-l-md sm:block">
          16+
        </div>
      </div>
    </section>
  );
}

