import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Play, Plus, ThumbsUp, Volume2, VolumeX, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { imageUrl, mediaTitle, mediaYear } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

const genres: Record<number, string> = {
  12: "Adventure",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Sci-Fi",
  9648: "Mystery",
  10759: "Action & Adventure",
};

const LIKES_KEY = "streamly_likes";

export function InfoModal({ catalog }: { catalog: MediaItem[] }) {
  const { selectedMedia: media, closeMedia, myList, toggleList, openMedia } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [likedList, setLikedList] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(LIKES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = media ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [media]);

  const toggleLike = (id: number) => {
    setLikedList((prev) => {
      const isLiked = prev.includes(id);
      const next = isLiked ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      setShowFeedback(isLiked ? "Removed rating" : "Rated: I like this!");
      setTimeout(() => setShowFeedback(null), 2000);
      return next;
    });
  };

  const isLiked = media ? likedList.includes(media.id) : false;

  const similar = media
    ? catalog
        .filter(
          (item) =>
            item.id !== media.id && item.genre_ids.some((id) => media.genre_ids.includes(id))
        )
        .slice(0, 6)
    : [];

  return (
    <AnimatePresence>
      {media && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && closeMedia()}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-0 py-0 backdrop-blur-sm sm:px-6 sm:py-12"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${mediaTitle(media)} details`}
            initial={{ y: 60, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 50, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="modal-scroll relative mx-auto min-h-screen max-w-4xl overflow-hidden bg-[#181818] shadow-2xl sm:min-h-0 sm:rounded-2xl border border-white/10"
          >
            {/* Modal Backdrop Banner */}
            <div
              className="relative aspect-[16/9] bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl(media.backdrop_path, "original")})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30" />

              {/* Close Button */}
              <button
                onClick={closeMedia}
                className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-[#181818]/90 border border-white/20 text-white transition-all hover:bg-[#333] hover:scale-110"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              {/* Interactive Volume Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute right-4 top-1/2 grid size-9 place-items-center rounded-full border-2 border-white/60 bg-black/40 text-white transition-all hover:border-white hover:bg-black/60 hover:scale-110"
                aria-label={isMuted ? "Unmute preview audio" : "Mute preview audio"}
                title={isMuted ? "Preview Audio: Muted" : "Preview Audio: Playing"}
              >
                {isMuted ? <VolumeX className="size-4 text-red-400" /> : <Volume2 className="size-4" />}
              </button>

              {/* Media Title & Actions Overlay */}
              <div className="absolute bottom-7 left-5 right-5 sm:left-12">
                <h2 className="max-w-xl text-3xl font-black tracking-tight text-white drop-shadow-2xl sm:text-5xl">
                  {mediaTitle(media)}
                </h2>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/watch?id=${media.id}&title=${encodeURIComponent(mediaTitle(media))}`}
                    state={{ media }}
                    onClick={closeMedia}
                    className="flex items-center gap-2 rounded-full bg-white px-7 py-2.5 font-bold text-black shadow-lg transition-all hover:bg-[#ddd] hover:scale-105 active:scale-95"
                  >
                    <Play className="size-5 fill-current" /> Play
                  </Link>

                  <button
                    onClick={() => toggleList(media.id)}
                    className="grid size-10 place-items-center rounded-full border-2 border-[#aaa] bg-black/40 text-white transition-all hover:scale-110 hover:border-white"
                    aria-label={myList.includes(media.id) ? "Remove from my list" : "Add to my list"}
                    title={myList.includes(media.id) ? "In My List (Click to remove)" : "Add to My List"}
                  >
                    {myList.includes(media.id) ? (
                      <Check className="size-5 text-[#46d369]" />
                    ) : (
                      <Plus className="size-5 text-white" />
                    )}
                  </button>

                  {/* Interactive Thumbs Up Rating */}
                  <button
                    onClick={() => toggleLike(media.id)}
                    className={`grid size-10 place-items-center rounded-full border-2 transition-all hover:scale-110 ${
                      isLiked
                        ? "border-[#46d369] bg-[#46d369]/20 text-[#46d369] shadow-[0_0_15px_rgba(70,211,105,0.4)]"
                        : "border-[#aaa] bg-black/40 text-white hover:border-white"
                    }`}
                    aria-label={isLiked ? "Liked (Click to unlike)" : "Rate title thumbs up"}
                    title={isLiked ? "You rated this title" : "I like this"}
                  >
                    <ThumbsUp className={`size-5 ${isLiked ? "fill-current" : ""}`} />
                  </button>

                  {showFeedback && (
                    <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md animate-in fade-in">
                      {showFeedback}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className="grid gap-8 px-5 pb-10 pt-4 sm:grid-cols-[2fr_1fr] sm:px-12">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-[#46d369]">
                    {Math.min(98, Math.round((media.vote_average || 8) * 10))}% Match
                  </span>
                  <span className="text-[#ccc]">{mediaYear(media)}</span>
                  <span className="rounded border border-[#777] px-2 py-0.5 text-xs text-[#ddd]">
                    {media.adult ? "18+" : "13+"}
                  </span>
                  <span className="text-[#ccc]">2h 18m</span>
                  <span className="rounded border border-[#777] px-1.5 py-0.5 text-[10px] text-[#aaa]">
                    HD
                  </span>
                  <span className="rounded border border-[#777] px-1.5 py-0.5 text-[10px] text-[#aaa]">
                    Ultra 4K
                  </span>
                </div>

                <p className="mt-5 leading-relaxed text-[#e5e5e5]">
                  {media.overview ||
                    "A captivating cinematic journey with deep drama, unforgettable characters, and brilliant storytelling."}
                </p>
              </div>

              <div className="space-y-3 text-sm text-[#888]">
                <p>
                  Cast:{" "}
                  <span className="text-[#ddd]">
                    Featured award-winning ensemble, top performers
                  </span>
                </p>
                <p>
                  Genres:{" "}
                  <span className="text-[#ddd]">
                    {media.genre_ids?.map((id) => genres[id]).filter(Boolean).join(", ") ||
                      "Sci-Fi, Action, Drama"}
                  </span>
                </p>
                <p>
                  This title is:{" "}
                  <span className="text-[#ddd]">Exciting, High-Stakes, Visionary</span>
                </p>
              </div>
            </div>

            {/* More Like This */}
            <div className="px-5 pb-12 sm:px-12">
              <h3 className="mb-5 text-xl font-bold text-white">More Like This</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {(similar.length ? similar : catalog.filter((item) => item.id !== media.id).slice(0, 6)).map(
                  (item) => (
                    <button
                      key={item.id}
                      onClick={() => openMedia(item)}
                      className="group overflow-hidden rounded-2xl bg-[#262626] text-left transition-all hover:-translate-y-1.5 hover:shadow-2xl border border-transparent hover:border-white/20"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={imageUrl(item.backdrop_path)}
                          alt={mediaTitle(item)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {Math.floor(90 + (item.vote_average || 7) * 4)}m
                        </span>
                      </div>
                      <div className="p-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#46d369]">
                            {Math.round((item.vote_average || 8) * 10)}% Match
                          </span>
                          <span className="text-[#888]">{mediaYear(item)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#bbb]">
                          {item.overview}
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
