import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { mediaTitle } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

const SAMPLE_VIDEOS: Record<number, string> = {
  1: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  2: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  3: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  5: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  6: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  7: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  8: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  9: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4",
  10: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
};

const DEFAULT_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";

const FALLBACK_MEDIA: MediaItem = {
  id: 1,
  title: "Dune: Part Two",
  overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
  backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  vote_average: 8.2,
  release_date: "2024-02-27",
  genre_ids: [878, 12],
};

export default function WatchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaId = Number(searchParams.get("id") ?? "1");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoSrc = SAMPLE_VIDEOS[mediaId] ?? DEFAULT_VIDEO;

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
    >
      {/* Top Header / Back Arrow */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center gap-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center rounded-full bg-black/50 text-white transition hover:bg-white/20"
          aria-label="Back to browse"
        >
          <ArrowLeft className="size-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {mediaTitle(FALLBACK_MEDIA)}
          </h1>
          <p className="text-xs text-[#aaa]">Now Streaming in Ultra HD 4K</p>
        </div>
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="h-full w-full object-cover cursor-pointer"
      />

      {/* Video Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pb-6 pt-12 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar */}
        <div className="group relative flex items-center mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded bg-white/30 accent-[#e50914] transition-all group-hover:h-2.5"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="grid size-10 place-items-center rounded-full text-white transition hover:scale-110"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-7 fill-current" /> : <Play className="size-7 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="grid size-9 place-items-center rounded-full text-white/80 transition hover:text-white"
              title="Rewind 10s"
            >
              <RotateCcw className="size-5" />
            </button>

            <button
              onClick={() => skip(10)}
              className="grid size-9 place-items-center rounded-full text-white/80 transition hover:text-white"
              title="Forward 10s"
            >
              <RotateCw className="size-5" />
            </button>

            <button
              onClick={toggleMute}
              className="grid size-9 place-items-center rounded-full text-white/80 transition hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>

            <span className="text-xs font-medium text-[#ccc]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded border border-white/40 bg-black/40 px-2 py-0.5 text-xs font-semibold text-white">
              HD 1080p
            </span>
            <button
              onClick={toggleFullscreen}
              className="grid size-9 place-items-center rounded-full text-white/80 transition hover:text-white"
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
