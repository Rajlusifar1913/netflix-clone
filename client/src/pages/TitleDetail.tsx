import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Play, Plus, Check, Star, Clock, Tv } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { InfoModal } from "@/components/InfoModal";
import { imageUrl, mediaTitle } from "@/lib/utils";
import { getCatalogVideos, GENRE_MAP } from "@/lib/videoCatalog";
import type { MediaItem } from "@/types/media";

const MOCK_CAST = [
  { name: "Alex Rivera", role: "Lead" },
  { name: "Jordan Chen", role: "Supporting" },
  { name: "Sam Patel", role: "Supporting" },
  { name: "Morgan Lee", role: "Co-Star" },
  { name: "Casey Quinn", role: "Guest Star" },
  { name: "Drew Collins", role: "Recurring" },
];

const MOCK_TV_SEASONS = [
  { season: 1, episodes: 8 },
  { season: 2, episodes: 10 },
  { season: 3, episodes: 10 },
  { season: 4, episodes: 12 },
];

export default function TitleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { myList, toggleList, openMedia, showToast } = useApp();
  const [selectedSeason, setSelectedSeason] = useState(1);

  const catalog = getCatalogVideos();

  const media = useMemo(() => {
    const numId = Number(id);
    return catalog.find((item) => item.id === numId) ?? catalog[0];
  }, [id, catalog]);

  const similar = useMemo(() => {
    if (!media) return [];
    return catalog
      .filter((item) => item.id !== media.id && item.genre_ids?.some((g) => media.genre_ids?.includes(g)))
      .slice(0, 8);
  }, [media, catalog]);

  const isInList = myList.includes(media?.id ?? 0);
  const isTV = media?.media_type === "tv" || !!media?.first_air_date;

  const genres = useMemo(() => {
    return (media?.genre_ids ?? [])
      .map((id) => GENRE_MAP[id])
      .filter(Boolean)
      .slice(0, 3);
  }, [media]);

  const year = media?.release_date?.slice(0, 4) ?? media?.first_air_date?.slice(0, 4) ?? "";

  if (!media) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-white">
        <p>Title not found.</p>
      </div>
    );
  }

  const handleToggleList = () => {
    toggleList(media.id);
    showToast(
      isInList ? `Removed from My List` : `Added to My List`,
      isInList ? "info" : "success"
    );
  };

  const episodeCount = MOCK_TV_SEASONS.find((s) => s.season === selectedSeason)?.episodes ?? 8;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0d0d0d] text-white">
      {/* Hero backdrop */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl(media.backdrop_path, "original")})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="relative -mt-32 z-10 mx-auto max-w-6xl px-6 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden w-48 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] sm:block"
          >
            <img
              src={imageUrl(media.poster_path ?? media.backdrop_path, "w500")}
              alt={mediaTitle(media)}
              className="aspect-[2/3] w-full object-cover"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex-1"
          >
            {isTV && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#e50914]">
                <Tv className="size-3.5" /> Series
              </p>
            )}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {mediaTitle(media)}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#aaa]">
              {year && <span className="font-semibold text-white">{year}</span>}
              {media.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-[#f5c518] text-[#f5c518]" />
                  <span className="font-semibold text-white">{media.vote_average.toFixed(1)}</span>
                  <span className="text-xs">/10</span>
                </span>
              )}
              {(media as any).durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {(media as any).durationMinutes}m
                </span>
              )}
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs font-bold">
                {media.adult ? "18+" : "16+"}
              </span>
              {(media as any).quality && (
                <span className="rounded bg-[#e50914]/20 border border-[#e50914]/30 px-1.5 py-0.5 text-xs font-bold text-[#e50914]">
                  {(media as any).quality}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span key={g} className="rounded-full bg-white/8 border border-white/10 px-3 py-1 text-xs font-medium text-[#ccc]">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-5 max-w-xl text-sm sm:text-base text-[#bbb] leading-7">
              {media.overview}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/watch?id=${media.id}&title=${encodeURIComponent(mediaTitle(media))}`}
                state={{ media }}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black shadow-lg transition-all hover:bg-white/80 hover:scale-105 active:scale-95"
              >
                <Play className="size-4 fill-current" />
                Play Now
              </Link>
              <button
                onClick={handleToggleList}
                className={`flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
                  isInList
                    ? "border-[#46d369]/40 bg-[#46d369]/10 text-[#46d369]"
                    : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {isInList ? <Check className="size-4" /> : <Plus className="size-4" />}
                {isInList ? "In My List" : "Add to List"}
              </button>
              <button
                onClick={() => openMedia(media as MediaItem)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
              >
                More Info
              </button>
            </div>
          </motion.div>
        </div>

        {/* Cast */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-14"
        >
          <h2 className="mb-4 text-lg font-bold">Cast</h2>
          <div className="flex flex-wrap gap-3">
            {MOCK_CAST.map((c) => (
              <div key={c.name} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a]/80 px-3 py-2 text-xs">
                <div className="size-7 rounded-full bg-gradient-to-br from-[#e50914]/30 to-[#e50914]/10 border border-[#e50914]/20 flex items-center justify-center font-bold text-[#e50914] text-[10px]">
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-[#777]">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Episodes (TV only) */}
        {isTV && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-14"
          >
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <h2 className="text-lg font-bold">Episodes</h2>
              <div className="flex gap-2">
                {MOCK_TV_SEASONS.map((s) => (
                  <button
                    key={s.season}
                    onClick={() => setSelectedSeason(s.season)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      selectedSeason === s.season
                        ? "bg-[#e50914] text-white"
                        : "border border-white/15 text-[#aaa] hover:text-white hover:border-white/30"
                    }`}
                  >
                    S{s.season}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
                <Link
                  key={ep}
                  to={`/watch?id=${media.id}&title=${encodeURIComponent(mediaTitle(media) + " S" + selectedSeason + "E" + ep)}`}
                  state={{ media }}
                  className="group flex items-center gap-4 rounded-xl border border-white/8 bg-[#1a1a1a]/60 p-4 transition hover:bg-[#252525]/80 hover:border-white/15"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/5 font-black text-[#e50914] text-sm group-hover:bg-[#e50914] group-hover:text-white transition-colors">
                    {ep}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Episode {ep}</p>
                    <p className="text-xs text-[#888]">Season {selectedSeason} · {(media as any).durationMinutes ?? 45}m</p>
                  </div>
                  <Play className="ml-auto size-4 text-[#666] group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Similar Titles */}
        {similar.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-14 mb-16"
          >
            <h2 className="mb-5 text-lg font-bold">More Like This</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  to={`/title/${item.id}`}
                  className="group overflow-hidden rounded-xl border border-white/8 bg-[#1a1a1a] transition hover:border-white/20 hover:scale-105"
                >
                  <img
                    src={imageUrl(item.poster_path ?? item.backdrop_path, "w500")}
                    alt={mediaTitle(item)}
                    className="aspect-[2/3] w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-white">{mediaTitle(item)}</p>
                    <p className="text-[10px] text-[#888]">{item.vote_average?.toFixed(1)} ★</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      <InfoModal catalog={catalog as MediaItem[]} />
    </main>
  );
}
