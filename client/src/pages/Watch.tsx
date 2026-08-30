import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Tv,
  Film,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { getVideoById } from "@/lib/videoCatalog";
import { recordVideoView } from "@/lib/analytics";
import { useSession } from "@/lib/mockAuth";
import { useApp } from "@/components/AppProvider";

// ─── Official High-Definition YouTube Trailer Key Map ───────────────────────────
const YOUTUBE_TRAILER_MAP: Record<number, string> = {
  1: "Way9Dexny3w", // Dune: Part Two
  2: "uYPbbksJxIg", // Oppenheimer
  3: "EXeTwQWrcwY", // The Dark Knight
  4: "b9EkMc79ZSU", // Stranger Things
  5: "Di310BC87gk", // Wednesday
  6: "gCcx85zbxz4", // Blade Runner 2049
  7: "uLtkt8BonwM", // The Last of Us
  8: "zSWdZVtXT7E", // Interstellar
  9: "fXmAurh012s", // Arcane
  10: "hEJnMQGkowski", // Mad Max: Fury Road
  11: "y-cqqAJIXgk", // The Bear
  12: "u4ZgI_Z2s_0", // Planet Earth III
  // Popular TMDB common IDs fallback map
  693134: "Way9Dexny3w", // Dune 2 TMDB ID
  872585: "uYPbbksJxIg", // Oppenheimer TMDB ID
  155: "EXeTwQWrcwY", // The Dark Knight TMDB ID
  66732: "b9EkMc79ZSU", // Stranger Things TMDB ID
  119051: "Di310BC87gk", // Wednesday TMDB ID
  157336: "zSWdZVtXT7E", // Interstellar TMDB ID
  94605: "fXmAurh012s", // Arcane TMDB ID
  76479: "y-cqqAJIXgk", // The Bear TMDB ID
  100088: "uLtkt8BonwM", // The Last of Us TMDB ID
  335984: "gCcx85zbxz4", // Blade Runner 2049 TMDB ID
  76341: "hEJnMQGkowski", // Mad Max TMDB ID
};

const DEFAULT_YOUTUBE_TRAILER = "Way9Dexny3w";

// ─── Backup HTML5 MP4 Video Streams Pool ─────────────────────────────────────────
const HTML5_VIDEO_POOL: string[] = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
];

const ALL_MEDIA_CATALOG: Record<number, MediaItem> = {
  1: { id: 1, title: "Dune: Part Two", overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", vote_average: 8.2, release_date: "2024-02-27", genre_ids: [878, 12] },
  2: { id: 2, title: "Oppenheimer", overview: "The story of an enigmatic physicist forced to grapple with the moral consequences of changing the world forever.", backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", vote_average: 8.1, release_date: "2023-07-19", genre_ids: [18, 36] },
  3: { id: 3, title: "The Dark Knight", overview: "Batman faces a criminal mastermind whose reign of chaos pushes Gotham and its heroes to their limits.", backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", vote_average: 8.5, release_date: "2008-07-16", genre_ids: [28, 80] },
  4: { id: 4, title: "Stranger Things", overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.", backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", vote_average: 8.6, first_air_date: "2016-07-15", genre_ids: [18, 9648], media_type: "tv" },
  5: { id: 5, title: "Wednesday", overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries at Nevermore Academy.", backdrop_path: "/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg", poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", vote_average: 8.4, first_air_date: "2022-11-23", genre_ids: [35, 9648], media_type: "tv" },
  6: { id: 6, title: "Blade Runner 2049", overview: "A young blade runner unearths a long-buried secret that leads him to track down a former LAPD officer.", backdrop_path: "/ilRyazdMJwN05exqhwK4tMKBYZs.jpg", poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", vote_average: 7.6, release_date: "2017-10-04", genre_ids: [878, 18] },
  7: { id: 7, title: "The Last of Us", overview: "A hardened survivor escorts a teenager across a post-apocalyptic America in search of hope.", backdrop_path: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", vote_average: 8.6, first_air_date: "2023-01-15", genre_ids: [18, 10759], media_type: "tv" },
  8: { id: 8, title: "Interstellar", overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", vote_average: 8.4, release_date: "2014-11-05", genre_ids: [12, 18, 878] },
  9: { id: 9, title: "Arcane", overview: "Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic and technology.", backdrop_path: "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg", poster_path: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg", vote_average: 8.7, first_air_date: "2021-11-06", genre_ids: [16, 10759], media_type: "tv" },
  10: { id: 10, title: "Mad Max: Fury Road", overview: "In a ruined wasteland, Max joins a rebel warrior fleeing a tyrant and his army in a roaring war rig.", backdrop_path: "/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg", poster_path: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg", vote_average: 7.6, release_date: "2015-05-13", genre_ids: [28, 12] },
  11: { id: 11, title: "The Bear", overview: "A young chef returns home to run his family's sandwich shop and transform its chaotic kitchen.", backdrop_path: "/ySRAQdbALRr5G5YVgR3SsjcJtLw.jpg", poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg", vote_average: 8.2, first_air_date: "2022-06-23", genre_ids: [18, 35], media_type: "tv" },
  12: { id: 12, title: "Planet Earth III", overview: "Extraordinary stories from the natural world reveal the beauty and fragility of life on Earth.", backdrop_path: "/7k3wAa6W0N0W5LYj7ZQhZQNWwH8.jpg", poster_path: "/2yfz0ZSgZQXWW8YpYhY4emTuW4q.jpg", vote_average: 9.0, first_air_date: "2023-10-22", genre_ids: [99], media_type: "tv" },
};

const FALLBACK_MEDIA: MediaItem = ALL_MEDIA_CATALOG[1];

export default function WatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get("id");
  const mediaId = Number(rawId ?? "1") || 1;
  const urlTitle = searchParams.get("title");
  const { data: session } = useSession();
  const { profile, addToWatchHistory } = useApp();

  const [currentMedia, setCurrentMedia] = useState<MediaItem>(() => {
    const passedMedia = (location.state as { media?: MediaItem } | null)?.media;
    if (passedMedia) return passedMedia;
    const catVideo = getVideoById(mediaId);
    if (catVideo) return catVideo;
    if (ALL_MEDIA_CATALOG[mediaId]) return ALL_MEDIA_CATALOG[mediaId];
    if (urlTitle) {
      return {
        ...FALLBACK_MEDIA,
        id: mediaId,
        title: urlTitle,
      };
    }
    return FALLBACK_MEDIA;
  });

  // Track YouTube Trailer Key
  const [youtubeKey, setYoutubeKey] = useState<string>(() => {
    return YOUTUBE_TRAILER_MAP[mediaId] || DEFAULT_YOUTUBE_TRAILER;
  });

  // Player mode: 'youtube' (default, 100% reliable) or 'mp4' (direct HTML5 stream)
  const [playerMode, setPlayerMode] = useState<"youtube" | "mp4">("youtube");

  useEffect(() => {
    const passedMedia = (location.state as { media?: MediaItem } | null)?.media;
    if (passedMedia) {
      setCurrentMedia(passedMedia);
    } else {
      const catVideo = getVideoById(mediaId);
      if (catVideo) {
        setCurrentMedia(catVideo);
      } else if (ALL_MEDIA_CATALOG[mediaId]) {
        setCurrentMedia(ALL_MEDIA_CATALOG[mediaId]);
      } else if (urlTitle) {
        setCurrentMedia((prev) => ({
          ...prev,
          id: mediaId,
          title: urlTitle,
        }));
      }
    }

    // Resolve Trailer Key from Catalog or TMDB
    if (YOUTUBE_TRAILER_MAP[mediaId]) {
      setYoutubeKey(YOUTUBE_TRAILER_MAP[mediaId]);
      return;
    }

    // Try fetching YouTube video trailer from TMDB if available
    const fetchTmdbTrailer = async () => {
      const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN as string | undefined;
      const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
      if (!token && !key) return;

      try {
        const type = searchParams.get("type") || (currentMedia.first_air_date ? "tv" : "movie");
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${mediaId}/videos${key ? `?api_key=${key}` : ""}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (res.ok) {
          const data = await res.json();
          const videos = (data?.results as Array<{ key: string; site: string; type: string }>) || [];
          const trailer =
            videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
            videos.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
            videos.find((v) => v.site === "YouTube");

          if (trailer?.key) {
            setYoutubeKey(trailer.key);
          }
        }
      } catch {}
    };

    fetchTmdbTrailer();
  }, [mediaId, urlTitle, location.state, currentMedia.first_air_date, searchParams]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTrackedViewRef = useRef<boolean>(false);

  // HTML5 MP4 Sources
  const customCatalogItem = getVideoById(mediaId);
  const html5Sources = useMemo(() => {
    const list: string[] = [];
    if (customCatalogItem?.videoUrl) list.push(customCatalogItem.videoUrl);
    const safeId = Math.abs(mediaId);
    list.push(HTML5_VIDEO_POOL[safeId % HTML5_VIDEO_POOL.length]);
    list.push(HTML5_VIDEO_POOL[(safeId + 1) % HTML5_VIDEO_POOL.length]);
    return list;
  }, [mediaId, customCatalogItem]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const currentHtml5Source = html5Sources[sourceIndex] ?? html5Sources[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);

  const isTV = currentMedia?.media_type === "tv" || !!currentMedia?.first_air_date;

  const tvSeasons = useMemo(
    () => [
      { season: 1, episodes: 8 },
      { season: 2, episodes: 8 },
      { season: 3, episodes: 6 },
    ],
    []
  );
  const currentSeasonEpisodes = tvSeasons.find((s) => s.season === selectedSeason)?.episodes ?? 8;

  // Record initial view in analytics
  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    recordVideoView(
      mediaId,
      mediaTitle(currentMedia) || "Stream Title",
      30,
      120 * 60,
      {
        id: session?.user?.id,
        email: session?.user?.email,
        name: profile?.name || session?.user?.name,
      }
    );
    addToWatchHistory({
      id: currentMedia.id,
      title: mediaTitle(currentMedia),
      progress: 25,
      backdrop_path: currentMedia.backdrop_path,
      poster_path: currentMedia.poster_path,
      media_type: currentMedia.media_type,
      watchedAt: Date.now(),
    });
  }, [mediaId, currentMedia, session, profile, addToWatchHistory]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // HTML5 Player helpers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setIsBuffering(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {/* Top Header / Back Arrow & Mode Switcher */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent p-5 sm:p-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="grid size-11 sm:size-13 place-items-center rounded-full bg-black/70 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95 shadow-2xl border border-white/10"
            aria-label="Back to browse"
          >
            <ArrowLeft className="size-7 sm:size-8 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-lg">
              {mediaTitle(currentMedia)}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="font-semibold text-[#e50914] flex items-center gap-1">
                <Sparkles className="size-3" /> Ultra HD 4K
              </span>
              <span>•</span>
              <span>Spatial Audio</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls: Stream Mode Toggle & Episode Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher Pill */}
          <div className="flex items-center rounded-full border border-white/20 bg-black/60 p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setPlayerMode("youtube")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                playerMode === "youtube"
                  ? "bg-[#e50914] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Play Official 4K Trailer"
            >
              <Film className="size-3.5" />
              <span className="hidden sm:inline">Official Trailer</span>
              <span className="sm:hidden">Trailer</span>
            </button>
            <button
              onClick={() => setPlayerMode("mp4")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                playerMode === "mp4"
                  ? "bg-[#e50914] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Play Direct Cloud MP4 Stream"
            >
              <Tv className="size-3.5" />
              <span className="hidden sm:inline">Cloud Stream</span>
              <span className="sm:hidden">Stream</span>
            </button>
          </div>

          {isTV && (
            <button
              onClick={() => setShowEpisodes((p) => !p)}
              className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-bold backdrop-blur-md hover:bg-white/20 transition shadow-lg"
            >
              Episodes
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Real-Time Ambilight Screen Glow */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden opacity-30">
        <div
          className="absolute inset-0 bg-cover bg-center blur-[120px] scale-110"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w500${currentMedia?.backdrop_path ?? currentMedia?.poster_path})`,
          }}
        />
      </div>

      {/* ─── PRIMARY PLAYER: CINEMATIC YOUTUBE PLAYER (100% Guaranteed Playback) ─── */}
      {playerMode === "youtube" ? (
        <div className="relative h-full w-full bg-black">
          <iframe
            key={youtubeKey}
            src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
              window.location.origin
            )}`}
            title={mediaTitle(currentMedia)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        /* ─── ALTERNATE PLAYER: HTML5 DIRECT MP4 STREAM ─── */
        <div className="relative h-full w-full bg-black">
          {isBuffering && !hasError && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/40">
              <div className="size-14 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent" />
            </div>
          )}

          {!isPlaying && !hasError && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 hover:bg-black/30 transition cursor-pointer"
            >
              <div className="flex size-20 sm:size-24 items-center justify-center rounded-full bg-[#e50914] text-white shadow-[0_0_50px_rgba(229,9,20,0.85)] transition-transform hover:scale-110 active:scale-95">
                <Play className="size-10 sm:size-12 fill-current ml-1" />
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertTriangle className="size-12 text-[#e50914] mb-3" />
              <h2 className="text-lg font-bold text-white mb-1">Direct stream connection failed</h2>
              <p className="max-w-md text-xs text-[#aaa] mb-6">
                Switch to Official Trailer mode for instant high-definition streaming.
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  setPlayerMode("youtube");
                }}
                className="rounded-full bg-[#e50914] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#b81d24] transition shadow-xl"
              >
                Switch to Official HD Trailer
              </button>
            </div>
          )}

          <video
            key={currentHtml5Source}
            ref={videoRef}
            src={currentHtml5Source}
            autoPlay
            playsInline
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={() => setIsBuffering(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              if (sourceIndex < html5Sources.length - 1) {
                setSourceIndex((p) => p + 1);
              } else {
                setHasError(true);
              }
            }}
            onClick={togglePlay}
            className="relative z-10 h-full w-full cursor-pointer object-cover"
          />

          {/* HTML5 Controls Bar */}
          <div
            className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pb-6 pt-12 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Seek Bar */}
            <div ref={progressBarRef} className="group relative flex items-center mb-5 cursor-pointer py-2 select-none">
              <div className="relative h-1.5 group-hover:h-3 w-full overflow-hidden rounded-full bg-white/20 transition-all shadow-inner">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-red-700 via-[#e50914] to-red-500 shadow-[0_0_14px_rgba(229,9,20,0.9)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress || 0}
                onChange={handleSeek}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
            </div>

            {/* Bottom buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="grid size-12 place-items-center rounded-full bg-white/10 text-white hover:scale-110 transition shadow-xl"
                >
                  {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-0.5" />}
                </button>
                <button onClick={() => skip(-10)} className="hover:scale-110 transition">
                  <RotateCcw className="size-6" />
                </button>
                <button onClick={() => skip(10)} className="hover:scale-110 transition">
                  <RotateCw className="size-6" />
                </button>
                <button onClick={toggleMute} className="hover:scale-110 transition">
                  {isMuted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
                </button>
                <span className="text-xs font-bold text-gray-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={toggleFullscreen} className="hover:scale-110 transition">
                  <Maximize className="size-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Episode Selector Panel (TV shows) */}
      <AnimatePresence>
        {showEpisodes && isTV && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring" as const, damping: 25, stiffness: 220 }}
            className="absolute inset-y-0 right-0 z-40 w-80 flex flex-col bg-black/95 backdrop-blur-2xl border-l border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-bold text-sm text-white">Episodes</p>
              <button
                onClick={() => setShowEpisodes(false)}
                className="text-white/60 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 px-5 py-3 border-b border-white/10">
              {tvSeasons.map((s) => (
                <button
                  key={s.season}
                  onClick={() => setSelectedSeason(s.season)}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                    selectedSeason === s.season
                      ? "bg-[#e50914] text-white"
                      : "border border-white/15 text-[#aaa] hover:text-white"
                  }`}
                >
                  S{s.season}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {Array.from({ length: currentSeasonEpisodes }, (_, i) => i + 1).map((ep) => (
                <Link
                  key={ep}
                  to={`/watch?id=${mediaId}&title=${encodeURIComponent(
                    mediaTitle(currentMedia) + " S" + selectedSeason + "E" + ep
                  )}`}
                  state={{ media: currentMedia }}
                  onClick={() => setShowEpisodes(false)}
                  className="group flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/5 p-3 text-sm transition hover:bg-white/15"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 font-black text-[#e50914] text-xs group-hover:bg-[#e50914] group-hover:text-white transition">
                    {ep}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-xs">Episode {ep}</p>
                    <p className="text-[10px] text-[#888]">S{selectedSeason} · 45m · 4K UHD</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
