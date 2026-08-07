import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Bookmark, Play, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InfoModal } from "@/components/InfoModal";
import { useApp } from "@/components/AppProvider";
import { mediaTitle, imageUrl } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

const CATALOG_ITEMS: MediaItem[] = [
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

export default function MyListPage() {
  const { myList, toggleList, openMedia } = useApp();
  const [query, setQuery] = useState("");

  const itemsInList = useMemo(() => {
    const matched = CATALOG_ITEMS.filter((item) => myList.includes(item.id));
    if (!query.trim()) return matched;
    const term = query.toLowerCase();
    return matched.filter(
      (item) =>
        mediaTitle(item).toLowerCase().includes(term) ||
        item.overview.toLowerCase().includes(term)
    );
  }, [myList, query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#141414] text-white">
      <Navbar onSearch={setQuery} />

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">My List</h1>

        {itemsInList.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="grid size-20 place-items-center rounded-full bg-white/5 border border-white/10 shadow-xl">
              <Bookmark className="size-10 text-[#e50914]" />
            </div>
            <h2 className="mt-6 text-xl font-semibold sm:text-2xl">Your list is currently empty</h2>
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
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6">
            {itemsInList.map((item) => (
              <motion.div
                key={item.id}
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
                      <button
                        onClick={() => openMedia(item)}
                        className="grid size-7 place-items-center rounded-full bg-white text-black hover:bg-white/80"
                        title="Play / View Info"
                      >
                        <Play className="size-3.5 fill-current ml-0.5" />
                      </button>
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
        )}
      </div>

      <InfoModal catalog={CATALOG_ITEMS} />
    </main>
  );
}
