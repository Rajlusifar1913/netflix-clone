import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDownAZ, ArrowUpAZ, Bookmark, Film, Play, Star, Trash2, Tv } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InfoModal } from "@/components/InfoModal";
import { useApp } from "@/components/AppProvider";
import { mediaTitle, imageUrl } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getCatalogVideos } from "@/lib/videoCatalog";

type SortMode = "added" | "az" | "za" | "rating";
type TypeMode = "all" | "movie" | "tv";

export default function MyListPage() {
  const { myList, toggleList, openMedia } = useApp();
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("added");
  const [typeMode, setTypeMode] = useState<TypeMode>("all");

  const catalogItems: MediaItem[] = useMemo(() => getCatalogVideos(), []);

  const itemsInList = useMemo(() => {
    let matched = catalogItems.filter((item) => myList.includes(item.id));

    // Type filter
    if (typeMode !== "all") {
      matched = matched.filter((item) =>
        typeMode === "tv" ? (item.media_type === "tv" || !!item.first_air_date) : (item.media_type !== "tv" && !item.first_air_date)
      );
    }

    // Text search
    if (query.trim()) {
      const term = query.toLowerCase();
      matched = matched.filter((item) =>
        mediaTitle(item).toLowerCase().includes(term) || item.overview.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortMode === "az") matched = [...matched].sort((a, b) => mediaTitle(a).localeCompare(mediaTitle(b)));
    if (sortMode === "za") matched = [...matched].sort((a, b) => mediaTitle(b).localeCompare(mediaTitle(a)));
    if (sortMode === "rating") matched = [...matched].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));

    return matched;
  }, [myList, query, sortMode, typeMode, catalogItems]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#141414] text-white">
      <Navbar onSearch={setQuery} />

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">My List</h1>

          {itemsInList.length > 0 || myList.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                <button onClick={() => setTypeMode("all")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${typeMode === "all" ? "bg-white text-black" : "text-[#aaa] hover:text-white"}`}>
                  All
                </button>
                <button onClick={() => setTypeMode("movie")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${typeMode === "movie" ? "bg-[#e50914] text-white" : "text-[#aaa] hover:text-white"}`}>
                  <Film className="size-3" /> Movies
                </button>
                <button onClick={() => setTypeMode("tv")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${typeMode === "tv" ? "bg-[#e50914] text-white" : "text-[#aaa] hover:text-white"}`}>
                  <Tv className="size-3" /> TV
                </button>
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                <button onClick={() => setSortMode("added")} title="Recently Added" className={`grid size-7 place-items-center rounded-full text-xs font-bold transition ${sortMode === "added" ? "bg-white text-black" : "text-[#aaa] hover:text-white"}`}>+</button>
                <button onClick={() => setSortMode("az")} title="A→Z" className={`grid size-7 place-items-center rounded-full transition ${sortMode === "az" ? "bg-white text-black" : "text-[#aaa] hover:text-white"}`}><ArrowDownAZ className="size-3.5" /></button>
                <button onClick={() => setSortMode("za")} title="Z→A" className={`grid size-7 place-items-center rounded-full transition ${sortMode === "za" ? "bg-white text-black" : "text-[#aaa] hover:text-white"}`}><ArrowUpAZ className="size-3.5" /></button>
                <button onClick={() => setSortMode("rating")} title="By Rating" className={`grid size-7 place-items-center rounded-full transition ${sortMode === "rating" ? "bg-white text-black" : "text-[#aaa] hover:text-white"}`}><Star className="size-3.5" /></button>
              </div>
            </div>
          ) : null}
        </div>

        {itemsInList.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="grid size-20 place-items-center rounded-full bg-white/5 border border-white/10 shadow-xl">
              <Bookmark className="size-10 text-[#e50914]" />
            </div>
            <h2 className="mt-6 text-xl font-semibold sm:text-2xl">
              {myList.length > 0 && (typeMode !== "all" || query) ? "No matching titles found" : "Your list is currently empty"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#999]">
              Never lose track of movies and TV shows you want to watch. Click the plus (+) icon on any title to add it here.
            </p>
            <Link
              to="/browse"
              className="mt-6 inline-flex items-center gap-2 rounded bg-[#e50914] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81d24]"
            >
              Explore Browse
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
              {itemsInList.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative cursor-pointer overflow-hidden rounded-md border border-white/10 bg-[#1f1f1f] shadow-lg transition-transform duration-300 hover:z-20 hover:scale-105"
                  onClick={() => openMedia(item)}
                >
                  <img
                    src={imageUrl(item.poster_path ?? item.backdrop_path, "w500")}
                    alt={mediaTitle(item)}
                    className="aspect-[2/3] w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h3 className="line-clamp-1 text-sm font-bold text-white">
                      {mediaTitle(item)}
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#46d369]">
                        {Math.round((item.vote_average ?? 7) * 10)}% Match
                      </span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/watch?id=${item.id}&title=${encodeURIComponent(mediaTitle(item))}`}
                          state={{ media: item }}
                          className="grid size-7 place-items-center rounded-full bg-white text-black hover:bg-white/80"
                          title="Play"
                        >
                          <Play className="size-3.5 fill-current ml-0.5" />
                        </Link>
                        <button
                          onClick={() => toggleList(item.id)}
                          className="grid size-7 place-items-center rounded-full border border-white/40 bg-black/60 text-white hover:border-white hover:bg-black/90"
                          title="Remove from My List"
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <InfoModal catalog={catalogItems} />
    </main>
  );
}
