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

const FALLBACK_MOVIES: MediaItem[] = [
  { id: 1,  title: "Dune: Part Two",    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",                backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",  vote_average: 8.2, release_date:  "2024-02-27", genre_ids: [878, 12] },
  { id: 2,  title: "Oppenheimer",        overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.",               backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",  vote_average: 8.1, release_date:  "2023-07-19", genre_ids: [18, 36] },
  { id: 3,  title: "The Dark Knight",    overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.",                          backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",  vote_average: 8.5, release_date:  "2008-07-16", genre_ids: [28, 80] },
  { id: 6,  title: "Blade Runner 2049",  overview: "A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.",                         backdrop_path: "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg",  poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",  vote_average: 7.6, release_date:  "2017-10-04", genre_ids: [878, 18] },
  { id: 8,  title: "Interstellar",       overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",                                      backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",  poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",  vote_average: 8.4, release_date:  "2014-11-05", genre_ids: [12, 18, 878] },
  { id: 10, title: "Mad Max: Fury Road", overview: "In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.",                          backdrop_path: "/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg",  poster_path: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg",  vote_average: 7.6, release_date:  "2015-05-13", genre_ids: [28, 12] },
];

const MOVIE_CATEGORIES: [string, string][] = [
  ["Popular Movies", "/movie/popular"],
  ["Top Rated Movies", "/movie/top_rated"],
  ["Action Blockbusters", "/discover/movie?with_genres=28"],
  ["Comedic Hits", "/discover/movie?with_genres=35"],
  ["Horror & Mystery", "/discover/movie?with_genres=27,9648"],
  ["Sci-Fi & Fantasy", "/discover/movie?with_genres=878"],
  ["Crime & Drama Hits", "/discover/movie?with_genres=80,18"],
  ["Animated Features", "/discover/movie?with_genres=16"],
];

function buildFallbackMovieData(): BrowseData {
  return {
    featured: FALLBACK_MOVIES[0],
    rows: MOVIE_CATEGORIES.map(([title], index) => ({
      title,
      items: [...FALLBACK_MOVIES, ...FALLBACK_MOVIES].slice(index, index + 12),
    })),
  };
}

async function fetchMovieCategory(endpoint: string): Promise<MediaItem[]> {
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
    .map((item) => ({ ...item, media_type: "movie" }));
}

import { apiRequest } from "@/lib/api";

async function loadMovieData(): Promise<BrowseData> {
  try {
    const serverRes = await apiRequest<{ data: { featured?: MediaItem; rows?: { title: string; items: MediaItem[] }[] } }>("/media/browse");
    if (serverRes?.data?.rows && serverRes.data.rows.length > 0) {
      const movieRows = serverRes.data.rows.map((row) => ({
        ...row,
        items: row.items.filter((item) => (item.media_type || "movie") === "movie"),
      })).filter((row) => row.items.length > 0);

      if (movieRows.length > 0) {
        return {
          featured: movieRows[0].items[0] || FALLBACK_MOVIES[0],
          rows: movieRows,
        };
      }
    }
  } catch { /* fallback to TMDB/local catalogue below */ }

  try {
    const results = await Promise.all(MOVIE_CATEGORIES.map(([, ep]) => fetchMovieCategory(ep)));
    const rows = MOVIE_CATEGORIES.map(([title], i) => ({
      title,
      items: results[i]?.length
        ? results[i].slice(0, 18)
        : [...FALLBACK_MOVIES, ...FALLBACK_MOVIES].slice(i, i + 12),
    }));
    return { featured: rows[0].items[0] ?? FALLBACK_MOVIES[0], rows };
  } catch {
    return buildFallbackMovieData();
  }
}

export default function MoviesPage() {
  const [data, setData] = useState<BrowseData>(buildFallbackMovieData);
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const { myList } = useApp();

  useEffect(() => {
    loadMovieData().then(setData);
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
            <GenreFilterBar items={catalog} activeGenre={activeGenre} onGenreChange={setActiveGenre} genreFilter={[28, 12, 35, 27, 878, 80, 18, 16]} />
          </div>
        )}
        {query && filteredRows[0].items.length === 0 ? (
          <div className="mx-auto flex min-h-[300px] max-w-xl flex-col items-center justify-center px-6 text-center">
            <SearchX className="size-12 text-[#666]" />
            <h2 className="mt-4 text-xl font-semibold">
              We couldn&apos;t find &ldquo;{query}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[#999]">
              Try searching for another movie or genre.
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
