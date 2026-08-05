import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MediaItem } from "@/types/media";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function imageUrl(path: string | null, size: "w500" | "w780" | "original" = "w780") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "/media-fallback.svg";
}

export function mediaTitle(media: MediaItem) {
  return media.title || media.name || media.original_name || "Untitled";
}

export function mediaYear(media: MediaItem) {
  const date = media.release_date || media.first_air_date;
  return date ? new Date(date).getFullYear() : 2025;
}
