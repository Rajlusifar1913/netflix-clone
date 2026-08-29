import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MessageCircle, PlaySquare, SearchX } from "lucide-react";
import { Hero } from "@/components/Hero";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { Navbar } from "@/components/Navbar";
import { useApp } from "@/components/AppProvider";
import { mediaTitle } from "@/lib/utils";
import type { BrowseData, MediaItem } from "@/types/media";

const FALLBACK_POPULAR: MediaItem[] = [
  { id: 1,  title: "Dune: Part Two",    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",                backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",  vote_average: 8.2, release_date:  "2024-02-27", genre_ids: [878, 12] },
  { id: 4,  title: "Stranger Things",    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.",               backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",  poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",  vote_average: 8.6, first_air_date: "2016-07-15", genre_ids: [18, 9648], media_type: "tv" },
  { id: 7,  title: "The Last of Us",     overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.",                                    backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",  poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",  vote_average: 8.6, first_air_date: "2023-01-15", genre_ids: [18, 10759], media_type: "tv" },
  { id: 2,  title: "Oppenheimer",        overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.",               backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",  vote_average: 8.1, release_date:  "2023-07-19", genre_ids: [18, 36] },
  { id: 5,  title: "Wednesday",          overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.",                backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",  poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",  vote_average: 8.4, first_air_date: "2022-11-23", genre_ids: [35, 9648], media_type: "tv" },
  { id: 3,  title: "The Dark Knight",    overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.",                          backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",  vote_average: 8.5, release_date:  "2008-07-16", genre_ids: [28, 80] },
];

const NEW_POPULAR_CATEGORIES: [string, string][] = [
  ["Trending This Week", "/trending/all/week"],
  ["Trending Today", "/trending/all/day"],
  ["Now Playing in Cinema", "/movie/now_playing"],
  ["Top 10 Worldwide", "/movie/top_rated"],
  ["Upcoming Movies", "/movie/upcoming"],
  ["Popular Series", "/tv/popular"],
  ["Currently Airing Shows", "/tv/on_the_air"],
  ["New Episodes Today", "/tv/airing_today"],
];

function buildFallbackPopularData(): BrowseData {
  return {
    featured: FALLBACK_POPULAR[0],
    rows: NEW_POPULAR_CATEGORIES.map(([title], index) => ({
      title,
      items: [...FALLBACK_POPULAR, ...FALLBACK_POPULAR].slice(index, index + 12),
    })),
  };
}

async function fetchPopularCategory(endpoint: string): Promise<MediaItem[]> {
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

import { apiRequest } from "@/lib/api";

async function loadPopularData(): Promise<BrowseData> {
  try {
    const serverRes = await apiRequest<{ data: { featured?: MediaItem; rows?: { title: string; items: MediaItem[] }[] } }>("/media/browse");
    if (serverRes?.data?.rows && serverRes.data.rows.length > 0) {
      return {
        featured: serverRes.data.featured || serverRes.data.rows[0].items[0] || FALLBACK_POPULAR[0],
        rows: serverRes.data.rows,
      };
    }
  } catch { /* fallback to TMDB/local catalogue below */ }

  try {
    const results = await Promise.all(
      NEW_POPULAR_CATEGORIES.map(([, ep]) => fetchPopularCategory(ep))
    );
    const rows = NEW_POPULAR_CATEGORIES.map(([title], i) => ({
      title,
      items: results[i]?.length
        ? results[i].slice(0, 18)
        : [...FALLBACK_POPULAR, ...FALLBACK_POPULAR].slice(i, i + 12),
    }));
    return { featured: rows[0].items[0] ?? FALLBACK_POPULAR[0], rows };
  } catch {
    return buildFallbackPopularData();
  }
}

export default function NewPopularPage() {
  const [data, setData] = useState<BrowseData>(buildFallbackPopularData);
  const [query, setQuery] = useState("");
  const { myList } = useApp();

  useEffect(() => {
    loadPopularData().then(setData);
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
    if (!query.trim()) return data.rows;
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
  }, [query, data.rows, catalog]);

  const listItems = catalog.filter((item) => myList.includes(item.id));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#141414] text-white">
      <Navbar onSearch={setQuery} />
      <Hero media={data.featured} />

      <div className="relative z-10 mt-2 pb-6">
        {query && filteredRows[0].items.length === 0 ? (
          <div className="mx-auto flex min-h-[300px] max-w-xl flex-col items-center justify-center px-6 text-center">
            <SearchX className="size-12 text-[#666]" />
            <h2 className="mt-4 text-xl font-semibold">
              We couldn&apos;t find &ldquo;{query}&rdquo;
            </h2>
            <p className="mt-2 text-sm text-[#999]">
              Try searching for another title or genre.
            </p>
          </div>
        ) : (
          filteredRows.map((row, index) => (
            <MovieRow
              key={row.title}
              title={row.title}
              items={row.items}
              ranked={!query && (index === 0 || index === 3)}
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
