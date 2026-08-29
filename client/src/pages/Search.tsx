import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Filter, SearchX, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getCatalogVideos, GENRE_MAP } from "@/lib/videoCatalog";
import { apiRequest } from "@/lib/api";

const SEARCH_HISTORY_KEY = "streamly-search-history";
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? "[]") as string[]; }
  catch { return []; }
}

function saveHistory(term: string, prev: string[]): string[] {
  const next = [term, ...prev.filter((t) => t !== term)].slice(0, MAX_HISTORY);
  try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* */ }
  return next;
}

type YearFilter = "all" | "before2020" | "2020-2022" | "2023+";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [catalogItems, setCatalogItems] = useState<MediaItem[]>(() => getCatalogVideos());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = () => setCatalogItems(getCatalogVideos());
    window.addEventListener("streamly:catalog-change", handleUpdate);
    return () => window.removeEventListener("streamly:catalog-change", handleUpdate);
  }, []);

  // Fetch backend search API results
  useEffect(() => {
    if (!query.trim()) return;

    apiRequest<{ data: { results: MediaItem[] } }>(`/media/search?q=${encodeURIComponent(query.trim())}`)
      .then((res) => {
        if (res?.data?.results && res.data.results.length > 0) {
          setCatalogItems((prev) => {
            const combinedMap = new Map<number, MediaItem>();
            prev.forEach((item) => combinedMap.set(item.id, item));
            res.data.results.forEach((item) => combinedMap.set(item.id || (item as unknown as { tmdbId?: number }).tmdbId || Math.floor(Math.random() * 100000), item));
            return Array.from(combinedMap.values());
          });
        }
      })
      .catch(() => { /* fallback to local filtering */ });
  }, [query]);

  const handleSearch = (term: string) => {
    setQuery(term);
    setShowHistory(false);
    if (term.trim()) setHistory((prev) => saveHistory(term.trim(), prev));
  };

  const availableGenres = useMemo(() => {
    return Array.from(new Set(catalogItems.flatMap((item) => item.genre_ids ?? [])))
      .filter((id) => GENRE_MAP[id])
      .slice(0, 12);
  }, [catalogItems]);

  const results = useMemo(() => {
    let items = catalogItems;

    // Type filter
    items = items.filter((item) => {
      const matchType = filterType === "all" || item.media_type === filterType || (filterType === "movie" && !item.media_type);
      return matchType;
    });

    // Genre filter
    if (activeGenre !== null) {
      items = items.filter((item) => item.genre_ids?.includes(activeGenre));
    }

    // Year filter
    if (yearFilter !== "all") {
      items = items.filter((item) => {
        const year = Number((item.release_date ?? item.first_air_date ?? "2000").slice(0, 4));
        if (yearFilter === "before2020") return year < 2020;
        if (yearFilter === "2020-2022") return year >= 2020 && year <= 2022;
        if (yearFilter === "2023+") return year >= 2023;
        return true;
      });
    }

    // Text filter
    if (!query.trim()) return items;
    const term = query.toLowerCase();
    return items.filter((item) =>
      mediaTitle(item).toLowerCase().includes(term) || item.overview.toLowerCase().includes(term)
    );
  }, [query, filterType, activeGenre, yearFilter, catalogItems]);

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <Navbar onSearch={(q) => { setQuery(q); if (q.trim()) setHistory((prev) => saveHistory(q.trim(), prev)); }} />

      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-8">
        {/* Search input with history */}
        <div className="relative mb-6">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) handleSearch(query); }}
            placeholder="Search titles, genres, keywords..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-[#555] outline-none transition focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/20"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition"
            >
              <X className="size-4" />
            </button>
          )}

          {/* History dropdown */}
          {showHistory && !query && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/10 bg-[#1a1a1a]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666]">Recent Searches</span>
                <button onClick={() => { setHistory([]); localStorage.removeItem(SEARCH_HISTORY_KEY); }} className="text-xs text-[#888] hover:text-white transition">
                  Clear all
                </button>
              </div>
              {history.map((term) => (
                <button
                  key={term}
                  onMouseDown={() => handleSearch(term)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left text-[#ccc] transition hover:bg-white/5 hover:text-white"
                >
                  <Clock className="size-3.5 text-[#666] shrink-0" />
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {query ? `Results for "${query}"` : "Explore Catalog"}
          </h1>

          {/* Type filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="size-4 text-[#888]" />
            {(["all", "movie", "tv"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filterType === t ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {t === "all" ? "All" : t === "movie" ? "Movies" : "TV Shows"}
              </button>
            ))}
          </div>
        </div>

        {/* Genre chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGenre(null)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              activeGenre === null ? "bg-[#e50914] text-white" : "border border-white/15 text-[#ccc] hover:text-white"
            }`}
          >
            All Genres
          </button>
          {availableGenres.map((id) => (
            <button
              key={id}
              onClick={() => setActiveGenre(id === activeGenre ? null : id)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                activeGenre === id ? "bg-[#e50914] text-white" : "border border-white/15 text-[#ccc] hover:text-white"
              }`}
            >
              {GENRE_MAP[id]}
            </button>
          ))}
        </div>

        {/* Year filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            { value: "all", label: "Any Year" },
            { value: "2023+", label: "2023+" },
            { value: "2020-2022", label: "2020–2022" },
            { value: "before2020", label: "Before 2020" },
          ] as { value: YearFilter; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setYearFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                yearFilter === opt.value ? "bg-white text-black" : "border border-white/15 text-[#ccc] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <SearchX className="size-16 text-[#555]" />
            <h2 className="mt-4 text-xl font-semibold">No titles matched your search</h2>
            <p className="mt-2 text-sm text-[#888]">Try searching for different keywords, titles, or genres.</p>
          </div>
        ) : (
          <div className="mt-8">
            <MovieRow title={query ? `${results.length} title${results.length !== 1 ? "s" : ""} found` : `${results.length} titles`} items={results} />
          </div>
        )}
      </div>

      <InfoModal catalog={catalogItems} />
    </main>
  );
}

