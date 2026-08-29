import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MessageCircle, PlaySquare, SearchX } from "lucide-react";
import { Hero } from "@/components/Hero";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { Navbar } from "@/components/Navbar";
import { GenreFilterBar } from "@/components/GenreFilterBar";
import { useApp } from "@/components/AppProvider";
import { mediaTitle, imageUrl } from "@/lib/utils";
import type { BrowseData, MediaItem } from "@/types/media";

// ─── Fallback catalogue (used when TMDB API key isn't set) ────────────────────

const FALLBACK: MediaItem[] = [
  { id: 1,  title: "Dune: Part Two",    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",                backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",  vote_average: 8.2, release_date:  "2024-02-27", genre_ids: [878, 12] },
  { id: 2,  title: "Oppenheimer",        overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.",               backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",  vote_average: 8.1, release_date:  "2023-07-19", genre_ids: [18, 36] },
  { id: 3,  title: "The Dark Knight",    overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.",                          backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",  vote_average: 8.5, release_date:  "2008-07-16", genre_ids: [28, 80] },
  { id: 4,  title: "Stranger Things",    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.",               backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",  poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",  vote_average: 8.6, first_air_date: "2016-07-15", genre_ids: [18, 9648], media_type: "tv" },
  { id: 5,  title: "Wednesday",          overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.",                backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",  poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",  vote_average: 8.4, first_air_date: "2022-11-23", genre_ids: [35, 9648], media_type: "tv" },
  { id: 6,  title: "Blade Runner 2049",  overview: "A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.",                         backdrop_path: "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg",  poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",  vote_average: 7.6, release_date:  "2017-10-04", genre_ids: [878, 18] },
  { id: 7,  title: "The Last of Us",     overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.",                                    backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",  poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",  vote_average: 8.6, first_air_date: "2023-01-15", genre_ids: [18, 10759], media_type: "tv" },
  { id: 8,  title: "Interstellar",       overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",                                      backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",  poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",  vote_average: 8.4, release_date:  "2014-11-05", genre_ids: [12, 18, 878] },
  { id: 9,  title: "Arcane",             overview: "Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.",                  backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",  poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",  vote_average: 8.7, first_air_date: "2021-11-06", genre_ids: [16, 10759], media_type: "tv" },
  { id: 10, title: "Mad Max: Fury Road", overview: "In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.",                          backdrop_path: "/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg",  poster_path: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg",  vote_average: 7.6, release_date:  "2015-05-13", genre_ids: [28, 12] },
  { id: 11, title: "The Bear",           overview: "A young chef returns home to run his family's sandwich shop and transform its chaotic kitchen.",                                 backdrop_path: "/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg",  poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",  vote_average: 8.2, first_air_date: "2022-06-23", genre_ids: [18, 35], media_type: "tv" },
  { id: 12, title: "Planet Earth III",   overview: "Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.",                                 backdrop_path: "/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg",  poster_path: "/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg",  vote_average: 9.0, first_air_date: "2023-10-22", genre_ids: [99], media_type: "tv" },
];

const CATEGORIES: [string, string][] = [
  ["Trending Now", "/trending/all/week"],
  ["Top Rated Worldwide", "/movie/top_rated"],
  ["Action & Adventure", "/discover/movie?with_genres=28,12"],
  ["Sci-Fi & Cyberpunk Hits", "/discover/movie?with_genres=878"],
  ["Comedic Hits", "/discover/movie?with_genres=35"],
  ["Critically Acclaimed TV Series", "/tv/top_rated"],
  ["Horror & Thrillers", "/discover/movie?with_genres=27,53"],
  ["Animation & Anime Specials", "/discover/movie?with_genres=16"],
  ["Documentaries & Real Stories", "/discover/movie?with_genres=99"],
  ["Mystery & Suspense", "/discover/movie?with_genres=9648"],
];

function buildFallbackData(): BrowseData {
  return {
    featured: FALLBACK[0],
    rows: CATEGORIES.map(([title], index) => ({
      title,
      items: [...FALLBACK, ...FALLBACK].slice(index, index + 12),
    })),
  };
}

async function fetchCategory(endpoint: string): Promise<MediaItem[]> {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN as string | undefined;
  const key   = import.meta.env.VITE_TMDB_API_KEY      as string | undefined;
  if (!token && !key) return [];

  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://api.themoviedb.org/3${endpoint}${key ? `${separator}api_key=${key}` : ""}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const json = (await res.json()) as { results?: MediaItem[] };
  return (json.results ?? []).filter((item) => item.backdrop_path);
}

const CACHE_KEY = "streamly_browse_cache";
const CACHE_TIME_KEY = "streamly_browse_cache_time";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

import { apiRequest } from "@/lib/api";

async function loadBrowseData(): Promise<BrowseData> {
  // 1. Try Backend /media/browse API
  try {
    const serverRes = await apiRequest<{ data: { featured?: MediaItem; rows?: { title: string; items: MediaItem[] }[] } }>("/media/browse");
    if (serverRes?.data?.rows && serverRes.data.rows.length > 0) {
      const data: BrowseData = {
        featured: serverRes.data.featured || serverRes.data.rows[0].items[0] || FALLBACK[0],
        rows: serverRes.data.rows,
      };
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      } catch { /* ignore */ }
      return data;
    }
  } catch {
    // Fall through to TMDB / fallback catalogue below
  }

  try {
    const results = await Promise.all(CATEGORIES.map(([, ep]) => fetchCategory(ep)));
    const rows = CATEGORIES.map(([title], i) => ({
      title,
      items: results[i]?.length
        ? results[i].slice(0, 18)
        : [...FALLBACK, ...FALLBACK].slice(i, i + 12),
    }));
    const data: BrowseData = { featured: rows[0].items[0] ?? FALLBACK[0], rows };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch {
      // Ignore cache write errors
    }
    return data;
  } catch {
    return buildFallbackData();
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [data, setData] = useState<BrowseData>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_TTL) {
        return JSON.parse(cached) as BrowseData;
      }
    } catch {
      // Ignore cache read errors
    }
    return buildFallbackData();
  });
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const { myList, watchHistory } = useApp();

  useEffect(() => {
    loadBrowseData().then(setData);
  }, []);

  const catalog = useMemo(
    () =>
      Array.from(
        new Map(
          data.rows.flatMap((r) => r.items).map((item) => [item.id, item])
        ).values()
      ),
    [data.rows]
  );

  const continueWatching = useMemo(() => {
    if (!watchHistory.length) return [];
    return watchHistory.slice(0, 10).map((h) => {
      const found = catalog.find((item) => item.id === h.id);
      return found ? { ...found, _progress: h.progress } : null;
    }).filter(Boolean) as (MediaItem & { _progress: number })[];
  }, [watchHistory, catalog]);

  const filteredRows = useMemo(() => {
    let rows = data.rows;
    if (activeGenre !== null) {
      rows = rows.map((row) => ({
        ...row,
        items: row.items.filter((item) => item.genre_ids?.includes(activeGenre)),
      })).filter((row) => row.items.length > 0);
    }
    if (!query.trim()) return rows;
    const term = query.toLowerCase();
    return [
      {
        title: `Results for "${query}"`,
        items: catalog.filter(
          (item) =>
            mediaTitle(item).toLowerCase().includes(term) ||
            item.overview.toLowerCase().includes(term)
        ),
      },
    ];
  }, [query, activeGenre, data.rows, catalog]);

  const listItems = catalog.filter((item) => myList.includes(item.id));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#141414] text-white">
      <Navbar onSearch={setQuery} />
      <Hero media={data.featured} items={data.rows[0]?.items} />

      <div id="catalog" className="relative z-10 mt-2 pb-6">
        {/* Genre filter bar */}
        {!query && (
          <div className="mb-4">
            <GenreFilterBar items={catalog} activeGenre={activeGenre} onGenreChange={setActiveGenre} />
          </div>
        )}

        {/* Continue Watching row */}
        {!query && continueWatching.length > 0 && (
          <div className="px-4 sm:px-6 mb-4">
            <h2 className="mb-3 text-base font-bold text-white">Continue Watching</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {continueWatching.map((item) => (
                <Link
                  key={item.id}
                  to={`/watch?id=${item.id}&title=${encodeURIComponent(mediaTitle(item))}`}
                  state={{ media: item }}
                  className="group relative shrink-0 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] transition hover:scale-105 hover:border-white/20"
                >
                  <img
                    src={imageUrl(item.backdrop_path ?? item.poster_path, "w500")}
                    alt={mediaTitle(item)}
                    className="aspect-video w-full object-cover"
                  />
                  {/* Progress bar */}
                  <div className="absolute bottom-6 inset-x-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-[#e50914] rounded-full"
                      style={{ width: `${item._progress}%` }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-white">{mediaTitle(item)}</p>
                    <p className="text-[10px] text-[#888]">{item._progress}% watched</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {query && filteredRows[0].items.length === 0 ? (
          <div className="mx-auto flex min-h-[300px] max-w-xl flex-col items-center justify-center px-6 text-center">
            <SearchX className="size-12 text-[#666]" />
            <h2 className="mt-4 text-xl font-semibold">
              We couldn&apos;t find &ldquo;{query}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[#999]">
              Try another title, actor, or genre.
            </p>
          </div>
        ) : (
          filteredRows.map((row, index) => (
            <MovieRow
              key={row.title}
              title={row.title}
              items={row.items}
              ranked={!query && index === 1}
            />
          ))
        )}
        {!query && listItems.length > 0 && (
          <MovieRow title="My List" items={listItems} />
        )}
      </div>

      <footer className="mx-auto max-w-5xl px-6 pb-14 pt-5 text-xs text-[#777]">
        <div className="flex items-center gap-6 text-white/80">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e50914] transition-colors"
            aria-label="Facebook"
          >
            <MessageCircle className="size-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e50914] transition-colors"
            aria-label="Instagram"
          >
            <Camera className="size-5" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e50914] transition-colors"
            aria-label="YouTube"
          >
            <PlaySquare className="size-5" />
          </a>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Audio and Subtitles</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Media Center</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Privacy</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Contact Us</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Audio Description</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Investor Relations</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Legal Notices</Link>
          <Link to="/help" className="hover:underline hover:text-[#ccc]">Cookie Preferences</Link>
        </div>
        <button
          onClick={() => alert("Streamly Service Diagnostic Code: 982-411-STREAMLY")}
          className="mt-7 border border-[#777] px-2 py-1.5 hover:text-white transition-colors"
        >
          Service Code
        </button>
        <p className="mt-5">© 2026 Streamly Entertainment</p>
      </footer>

      <InfoModal catalog={catalog} />
    </main>
  );
}
