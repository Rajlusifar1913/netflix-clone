import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GENRE_MAP } from "@/lib/videoCatalog";
import type { MediaItem } from "@/types/media";

interface GenreFilterBarProps {
  items: MediaItem[];
  activeGenre: number | null;
  onGenreChange: (genreId: number | null) => void;
  genreFilter?: number[]; // subset of genre IDs to show
}

export function GenreFilterBar({ items, activeGenre, onGenreChange, genreFilter }: GenreFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Collect all genre IDs used in the items
  const availableGenres = Array.from(
    new Set(items.flatMap((item) => item.genre_ids ?? []))
  )
    .filter((id) => GENRE_MAP[id])
    .filter((id) => !genreFilter || genreFilter.includes(id))
    .slice(0, 14);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (availableGenres.length === 0) return null;

  return (
    <div className="relative flex items-center gap-1 px-4 sm:px-6 pb-1">
      {/* Left arrow */}
      {showLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 grid size-8 place-items-center rounded-full bg-[#141414] shadow-xl border border-white/10 text-white/70 hover:text-white transition"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* All pill */}
        <button
          onClick={() => onGenreChange(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            activeGenre === null
              ? "bg-white text-black shadow-md"
              : "border border-white/15 text-[#ccc] hover:border-white/30 hover:text-white"
          }`}
        >
          All
        </button>

        {availableGenres.map((id) => (
          <button
            key={id}
            onClick={() => onGenreChange(id === activeGenre ? null : id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeGenre === id
                ? "bg-[#e50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.5)]"
                : "border border-white/15 text-[#ccc] hover:border-white/30 hover:text-white"
            }`}
          >
            {GENRE_MAP[id]}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      {showRight && availableGenres.length > 6 && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 grid size-8 place-items-center rounded-full bg-[#141414] shadow-xl border border-white/10 text-white/70 hover:text-white transition"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
