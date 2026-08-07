import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InfoModal } from "@/components/InfoModal";
import { MovieRow } from "@/components/MovieRow";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

const ALL_MEDIA: MediaItem[] = [
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
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");

  const results = useMemo(() => {
    if (!query.trim()) return ALL_MEDIA;
    const term = query.toLowerCase();
    return ALL_MEDIA.filter((item) => {
      const matchText = mediaTitle(item).toLowerCase().includes(term) || item.overview.toLowerCase().includes(term);
      const matchType = filterType === "all" || item.media_type === filterType || (filterType === "movie" && !item.media_type);
      return matchText && matchType;
    });
  }, [query, filterType]);

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

      <InfoModal catalog={ALL_MEDIA} />
    </main>
  );
}
