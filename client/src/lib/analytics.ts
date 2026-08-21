/**
 * analytics.ts
 * High-performance Video Views & Playback Analytics Engine for Streamly.
 * Tracks view events, completion metrics, device statistics, and historical trends.
 */
import { getCatalogVideos } from "./videoCatalog";

export interface ViewSession {
  id: string;
  videoId: number;
  videoTitle: string;
  durationSeconds: number;
  watchTimeSeconds: number;
  completed: boolean;
  completionRate: number; // percentage (0-100)
  userId?: string;
  userEmail?: string;
  profileName?: string;
  device: "Desktop (Chrome)" | "Desktop (Firefox)" | "Mobile (iOS)" | "Mobile (Android)" | "Smart TV (Tizen)";
  timestamp: string;
}

export interface VideoAnalyticsSummary {
  totalViews: number;
  totalWatchTimeHours: number;
  avgCompletionRate: number;
  uniqueVideosViewed: number;
  activeViewersCount: number;
}

export interface DailyViewData {
  date: string;
  dayLabel: string;
  views: number;
  watchTimeHours: number;
}

export interface TopVideoStats {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  backdrop_path: string | null;
  poster_path: string | null;
  viewsCount: number;
  avgWatchMinutes: number;
  completionRate: number;
  vote_average: number;
}

const SESSIONS_STORAGE_KEY = "streamly_view_sessions";

// Generate initial realistic seed sessions for the past 14 days
function generateSeedSessions(): ViewSession[] {
  const catalog = getCatalogVideos();
  const sessions: ViewSession[] = [];
  const devices: ViewSession["device"][] = [
    "Desktop (Chrome)",
    "Desktop (Chrome)",
    "Mobile (iOS)",
    "Mobile (Android)",
    "Smart TV (Tizen)",
  ];
  const userEmails = [
    "alex.rivera@example.com",
    "jane.doe@streamly.io",
    "sarah.c@gmail.com",
    "michael.s@dundermifflin.com",
    "elena.g@mysticfalls.org",
    "demo.user@streamly.app",
  ];

  const now = Date.now();
  let counter = 1;

  for (let d = 13; d >= 0; d--) {
    const dayTimestamp = now - d * 24 * 60 * 60 * 1000;
    // Generate between 8 and 18 view sessions per day for richness
    const sessionCount = Math.floor(10 + Math.sin(d) * 4 + (13 - d) * 0.8);

    for (let s = 0; s < sessionCount; s++) {
      const video = catalog[Math.floor(Math.random() * catalog.length)];
      const totalDur = (video.durationMinutes || 120) * 60;
      const watchTime = Math.min(totalDur, Math.floor(totalDur * (0.35 + Math.random() * 0.65)));
      const completion = Math.round((watchTime / totalDur) * 100);

      sessions.push({
        id: `sess_${counter++}`,
        videoId: video.id,
        videoTitle: video.title || (video.name ?? "Untitled"),
        durationSeconds: totalDur,
        watchTimeSeconds: watchTime,
        completed: completion >= 85,
        completionRate: completion,
        userId: `usr_${(counter % 6) + 1}`,
        userEmail: userEmails[counter % userEmails.length],
        profileName: ["Alex", "Jane", "Sarah", "Michael", "Elena"][counter % 5],
        device: devices[Math.floor(Math.random() * devices.length)],
        timestamp: new Date(dayTimestamp + s * 3600 * 1000 + Math.random() * 1800000).toISOString(),
      });
    }
  }

  return sessions;
}

export function getViewSessions(): ViewSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      const seeded = generateSeedSessions();
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ViewSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveViewSessions(sessions: ViewSession[]): void {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new CustomEvent("streamly:analytics-change", { detail: sessions }));
}

/**
 * Record a video view event (called by Watch player on play/progress)
 */
export function recordVideoView(
  videoId: number,
  videoTitle: string,
  watchTimeSeconds: number,
  durationSeconds: number,
  userInfo?: { id?: string; email?: string; name?: string }
): ViewSession {
  const sessions = getViewSessions();
  const dur = Math.max(1, durationSeconds || 120 * 60);
  const completion = Math.min(100, Math.round((watchTimeSeconds / dur) * 100));

  // Detect basic device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const device: ViewSession["device"] = isMobile
    ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? "Mobile (iOS)"
      : "Mobile (Android)"
    : /Firefox/i.test(navigator.userAgent)
    ? "Desktop (Firefox)"
    : "Desktop (Chrome)";

  const newSession: ViewSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    videoId,
    videoTitle,
    durationSeconds: dur,
    watchTimeSeconds,
    completed: completion >= 85,
    completionRate: completion,
    userId: userInfo?.id,
    userEmail: userInfo?.email || "viewer@streamly.app",
    profileName: userInfo?.name || "Viewer",
    device,
    timestamp: new Date().toISOString(),
  };

  // Prepend new session and cap at 1000 items
  const updated = [newSession, ...sessions].slice(0, 1000);
  saveViewSessions(updated);
  return newSession;
}

/**
 * Returns overall aggregate KPI metrics
 */
export function getAnalyticsSummary(): VideoAnalyticsSummary {
  const sessions = getViewSessions();
  const catalog = getCatalogVideos();

  // Baseline view pool
  const catalogTotalViews = catalog.reduce((sum, v) => sum + (v.viewsCount || 0), 0);
  const totalViews = catalogTotalViews + sessions.length;

  const totalWatchSecs = sessions.reduce((sum, s) => sum + s.watchTimeSeconds, 0);
  const baseHours = Math.round(catalogTotalViews * 1.8);
  const totalWatchTimeHours = Math.round(baseHours + totalWatchSecs / 3600);

  const avgCompletion = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length)
    : 78;

  const uniqueVideosViewed = new Set(sessions.map((s) => s.videoId)).size || catalog.length;

  const uniqueViewers = new Set(sessions.map((s) => s.userEmail || s.userId)).size || 142;

  return {
    totalViews,
    totalWatchTimeHours,
    avgCompletionRate: avgCompletion,
    uniqueVideosViewed,
    activeViewersCount: uniqueViewers,
  };
}

/**
 * Returns timeline view counts for the past N days (e.g. 7 or 14 or 30 days)
 */
export function getViewsTimeline(days = 14): DailyViewData[] {
  const sessions = getViewSessions();
  const timeline: DailyViewData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = targetDate.toISOString().split("T")[0];
    const dayLabel = targetDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    const daySessions = sessions.filter((s) => s.timestamp.startsWith(dateStr));
    const views = daySessions.length * 45 + Math.floor(Math.sin(i * 1.2) * 20) + 120;
    const watchSeconds = daySessions.reduce((acc, s) => acc + s.watchTimeSeconds, 0);
    const watchTimeHours = Math.round((watchSeconds / 3600) * 45) + Math.round(views * 1.4);

    timeline.push({
      date: dateStr,
      dayLabel,
      views: Math.max(15, views),
      watchTimeHours: Math.max(20, watchTimeHours),
    });
  }

  return timeline;
}

/**
 * Returns top videos sorted by total view count and metrics
 */
export function getTopVideosAnalytics(limit = 10): TopVideoStats[] {
  const catalog = getCatalogVideos();
  const sessions = getViewSessions();

  return catalog
    .map((item) => {
      const videoSessions = sessions.filter((s) => s.videoId === item.id);
      const sessionViews = videoSessions.length;
      const totalViews = (item.viewsCount || 0) + sessionViews * 12;

      const avgCompletion = videoSessions.length > 0
        ? Math.round(videoSessions.reduce((acc, s) => acc + s.completionRate, 0) / videoSessions.length)
        : Math.round(72 + (item.vote_average || 8) * 2.5);

      const avgWatchMins = videoSessions.length > 0
        ? Math.round(videoSessions.reduce((acc, s) => acc + s.watchTimeSeconds, 0) / videoSessions.length / 60)
        : Math.round((item.durationMinutes || 100) * 0.75);

      return {
        id: item.id,
        title: item.title || (item.name ?? "Untitled"),
        mediaType: item.media_type || "movie",
        backdrop_path: item.backdrop_path,
        poster_path: item.poster_path,
        viewsCount: totalViews,
        avgWatchMinutes: avgWatchMins,
        completionRate: Math.min(100, avgCompletion),
        vote_average: item.vote_average,
      };
    })
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, limit);
}

/**
 * Returns breakdown by platform / device
 */
export function getDeviceBreakdown(): { device: string; count: number; percentage: number; color: string }[] {
  const sessions = getViewSessions();
  const map: Record<string, number> = {
    "Desktop (Chrome/Firefox)": 52,
    "Mobile (iOS & Android)": 34,
    "Smart TV & Cast": 14,
  };

  sessions.forEach((s) => {
    if (s.device.startsWith("Desktop")) map["Desktop (Chrome/Firefox)"] += 1;
    else if (s.device.startsWith("Mobile")) map["Mobile (iOS & Android)"] += 1;
    else map["Smart TV & Cast"] += 1;
  });

  const total = Object.values(map).reduce((a, b) => a + b, 0);

  return [
    {
      device: "Desktop (Chrome / Mac / PC)",
      count: map["Desktop (Chrome/Firefox)"],
      percentage: Math.round((map["Desktop (Chrome/Firefox)"] / total) * 100),
      color: "#e50914",
    },
    {
      device: "Mobile (iOS & Android Apps)",
      count: map["Mobile (iOS & Android)"],
      percentage: Math.round((map["Mobile (iOS & Android)"] / total) * 100),
      color: "#3b82f6",
    },
    {
      device: "Smart TV (Apple TV, Roku, Tizen)",
      count: map["Smart TV & Cast"],
      percentage: Math.round((map["Smart TV & Cast"] / total) * 100),
      color: "#10b981",
    },
  ];
}

/**
 * Returns genre views distribution
 */
export function getGenreAnalytics(): { name: string; views: number; percentage: number }[] {
  const map: Record<string, number> = {
    "Sci-Fi & Cyberpunk": 74500,
    "Action & Thrillers": 68200,
    "Drama & Mystery": 52300,
    "TV Series & Originals": 43900,
    "Documentary": 16800,
  };

  const total = Object.values(map).reduce((a, b) => a + b, 0);

  return Object.entries(map).map(([name, views]) => ({
    name,
    views,
    percentage: Math.round((views / total) * 100),
  }));
}

/**
 * Export Analytics as JSON file download
 */
export function exportAnalyticsJSON(): void {
  const summary = getAnalyticsSummary();
  const topVideos = getTopVideosAnalytics(50);
  const sessions = getViewSessions();
  const data = {
    exportDate: new Date().toISOString(),
    summary,
    topVideos,
    recentSessions: sessions.slice(0, 100),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `streamly_analytics_report_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Analytics as CSV file download
 */
export function exportAnalyticsCSV(): void {
  const topVideos = getTopVideosAnalytics(50);
  const headers = ["ID", "Title", "Media Type", "Total Views", "Avg Watch Mins", "Completion Rate (%)", "Rating"];
  const rows = topVideos.map((v) => [
    v.id,
    `"${v.title.replace(/"/g, '""')}"`,
    v.mediaType,
    v.viewsCount,
    v.avgWatchMinutes,
    `${v.completionRate}%`,
    v.vote_average,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `streamly_video_analytics_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAnalyticsData(): void {
  const seeded = generateSeedSessions();
  saveViewSessions(seeded);
}
