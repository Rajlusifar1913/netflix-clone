import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MessageCircle, PlaySquare, SearchX } from "lucide-react";
import { Hero } from "@/components/Hero";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { Navbar } from "@/components/Navbar";
import { GenreFilterBar } from "@/components/GenreFilterBar";
import { useApp } from "@/components/AppProvider";
import { mediaTitle } from "@/lib/utils";
import type { BrowseData, MediaItem } from "@/types/media";

const FALLBACK_TV: MediaItem[] = [
  { id: 4,  title: "Stranger Things",    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.",               backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",  poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",  vote_average: 8.6, first_air_date: "2016-07-15", genre_ids: [18, 9648], media_type: "tv" },
  { id: 5,  title: "Wednesday",          overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.",                backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",  poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",  vote_average: 8.4, first_air_date: "2022-11-23", genre_ids: [35, 9648], media_type: "tv" },
  { id: 7,  title: "The Last of Us",     overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.",                                    backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",  poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",  vote_average: 8.6, first_air_date: "2023-01-15", genre_ids: [18, 10759], media_type: "tv" },
  { id: 9,  title: "Arcane",             overview: "Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.",                  backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",  poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",  vote_average: 8.7, first_air_date: "2021-11-06", genre_ids: [16, 10759], media_type: "tv" },
  { id: 11, title: "The Bear",           overview: "A young chef returns home to run his family's sandwich shop and transform its chaotic kitchen.",                                 backdrop_path: "/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg",  poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",  vote_average: 8.2, first_air_date: "2022-06-23", genre_ids: [18, 35], media_type: "tv" },
  { id: 12, title: "Planet Earth III",   overview: "Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.",                                 backdrop_path: "/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg",  poster_path: "/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg",  vote_average: 9.0, first_air_date: "2023-10-22", genre_ids: [99], media_type: "tv" },
];

const TV_CATEGORIES: [string, string][] = [
  ["Popular TV Shows", "/tv/popular"],
  ["Top Rated Series", "/tv/top_rated"],
  ["Action & Adventure", "/discover/tv?with_genres=10759"],
  ["Comedy Series", "/discover/tv?with_genres=35"],
  ["Drama Shows", "/discover/tv?with_genres=18"],
  ["Sci-Fi & Fantasy", "/discover/tv?with_genres=10765"],
  ["Crime & Mystery Series", "/discover/tv?with_genres=80,9648"],
  ["Animated Series", "/discover/tv?with_genres=16"],
];

function buildFallbackTVData(): BrowseData {
  return {
    featured: FALLBACK_TV[0],
    rows: TV_CATEGORIES.map(([title], index) => ({
      title,
      items: [...FALLBACK_TV, ...FALLBACK_TV].slice(index, index + 12),
    })),
  };
}

async function fetchTVCategory(endpoint: string): Promise<MediaItem[]> {
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
  return (json.results ?? [])
    .filter((item) => item.backdrop_path)
    .map((item) => ({ ...item, media_type: "tv" }));
}

import { apiRequest } from "@/lib/api";

async function loadTVData(): Promise<BrowseData> {
  try {
    const serverRes = await apiRequest<{ data: { featured?: MediaItem; rows?: { title: string; items: MediaItem[] }[] } }>("/media/browse");
    if (serverRes?.data?.rows && serverRes.data.rows.length > 0) {
      const tvRows = serverRes.data.rows.map((row) => ({
        ...row,
        items: row.items.filter((item) => item.media_type === "tv"),
      })).filter((row) => row.items.length > 0);

      if (tvRows.length > 0) {
        return {
          featured: tvRows[0].items[0] || FALLBACK_TV[0],
          rows: tvRows,
        };
      }
    }
  } catch { /* fallback to TMDB/local catalogue below */ }

  try {
    const results = await Promise.all(TV_CATEGORIES.map(([, ep]) => fetchTVCategory(ep)));
    const rows = TV_CATEGORIES.map(([title], i) => ({
      title,
      items: results[i]?.length
        ? results[i].slice(0, 18)
        : [...FALLBACK_TV, ...FALLBACK_TV].slice(i, i + 12),
    }));
    return { featured: rows[0].items[0] ?? FALLBACK_TV[0], rows };
  } catch {
    return buildFallbackTVData();
  }
}

export default function TVShowsPage() {
  const [data, setData] = useState<BrowseData>(buildFallbackTVData);
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const { myList } = useApp();

  useEffect(() => {
    loadTVData().then(setData);
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

      <div className="relative z-10 mt-2 pb-6">
        {!query && (
          <div className="mb-4">
            <GenreFilterBar items={catalog} activeGenre={activeGenre} onGenreChange={setActiveGenre} genreFilter={[18, 35, 9648, 16, 10759, 99, 10765, 80]} />
          </div>
        )}
        {query && filteredRows[0].items.length === 0 ? (
          <div className="mx-auto flex min-h-[300px] max-w-xl flex-col items-center justify-center px-6 text-center">
            <SearchX className="size-12 text-[#666]" />
            <h2 className="mt-4 text-xl font-semibold">
              We couldn&apos;t find &ldquo;{query}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[#999]">
              Try searching for another TV show or genre.
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
