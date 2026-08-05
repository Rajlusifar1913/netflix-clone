import { motion } from "motion/react";
import { Info, Play, Plus } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { imageUrl, mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

export function Hero({ media }: { media: MediaItem }) {
  const { openMedia, myList, toggleList } = useApp();
  return (
    <section className="relative h-[72vh] min-h-[540px] w-full overflow-hidden sm:h-[82vh] sm:min-h-[650px]">
      <motion.div initial={{ scale: 1.05, opacity: .7 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4 }} className="absolute inset-0 bg-cover bg-[68%_center] sm:bg-center" style={{ backgroundImage: `url(${imageUrl(media.backdrop_path, "original")})` }} />
      <div className="hero-vignette absolute inset-0" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .65 }} className="absolute bottom-[15%] left-0 z-10 max-w-2xl px-5 sm:bottom-[19%] sm:px-[4vw]">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-[#e5e5e5]"><span className="text-xl font-black tracking-[-.1em] text-[#e50914]">S</span> SERIES PREMIERE</p>
        <h1 className="max-w-xl text-balance text-4xl font-black leading-[.95] tracking-[-.04em] drop-shadow-2xl sm:text-6xl lg:text-7xl">{mediaTitle(media)}</h1>
        <p className="mt-5 line-clamp-3 max-w-xl text-sm font-medium leading-relaxed text-white drop-shadow-lg sm:text-base lg:text-lg">{media.overview}</p>
        <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => openMedia(media)} className="flex items-center gap-2 rounded bg-white px-5 py-2.5 font-bold text-black hover:bg-white/75 sm:px-7 sm:py-3"><Play className="size-5 fill-current" /> Play</button><button onClick={() => openMedia(media)} className="flex items-center gap-2 rounded bg-[#6d6d6e]/80 px-5 py-2.5 font-bold backdrop-blur-sm hover:bg-[#6d6d6e]/55 sm:px-7 sm:py-3"><Info className="size-5" /> More Info</button><button onClick={() => toggleList(media.id)} className="grid size-11 place-items-center rounded-full border-2 border-white/75 bg-black/25 hover:border-white hover:bg-white/15" aria-label="Add to my list"><Plus className={`size-5 transition-transform ${myList.includes(media.id) ? "rotate-45" : ""}`} /></button></div>
      </motion.div>
      <div className="absolute bottom-10 right-0 hidden border-l-2 border-white bg-black/45 py-2 pl-4 pr-[4vw] text-sm sm:block">16+</div>
    </section>
  );
}
