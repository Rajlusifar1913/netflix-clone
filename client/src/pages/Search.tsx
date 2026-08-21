import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getCatalogVideos } from "@/lib/videoCatalog";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [catalogItems, setCatalogItems] = useState<MediaItem[]>(() => getCatalogVideos());

  useEffect(() => {
    const handleUpdate = () => setCatalogItems(getCatalogVideos());
    window.addEventListener("streamly:catalog-change", handleUpdate);
    return () => window.removeEventListener("streamly:catalog-change", handleUpdate);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return catalogItems;
    const term = query.toLowerCase();
    return catalogItems.filter((item) => {
      const matchText = mediaTitle(item).toLowerCase().includes(term) || item.overview.toLowerCase().includes(term);
      const matchType = filterType === "all" || item.media_type === filterType || (filterType === "movie" && !item.media_type);
      return matchText && matchType;
    });
  }, [query, filterType, catalogItems]);

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <Navbar onSearch={setQuery} />

      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {query ? `Search Results for "${query}"` : "Explore Catalog"}
          </h1>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#888]" />
            <button
              onClick={() => setFilterType("all")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                filterType === "all" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("movie")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                filterType === "movie" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilterType("tv")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                filterType === "tv" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <SearchX className="size-16 text-[#555]" />
            <h2 className="mt-4 text-xl font-semibold">No titles matched your search</h2>
            <p className="mt-2 text-sm text-[#888]">Try searching for different keywords, titles, or genres.</p>
          </div>
        ) : (
          <div className="mt-8">
            <MovieRow title="Titles Found" items={results} />
          </div>
        )}
      </div>

      <InfoModal catalog={catalogItems} />
    </main>
  );
}
