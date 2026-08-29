import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Film,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Trash2,
  Edit,
  Play,
  Download,
  Shield,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Eye,
  TrendingUp,
  LayoutGrid,
  List,
  RefreshCw,
  Key,
  UserPlus,
  UserX,
  CreditCard,
  Crown,
  Sparkles,
  Zap,
  Sliders,
  Check,
} from "lucide-react";

import {
  adminLogout,
  getAdminSession,
  updateAdminPassword,
  type AdminUser,
} from "@/lib/adminAuth";

import {
  getCatalogVideos,
  fetchServerCatalog,
  createVideo,
  updateVideo,
  deleteVideo,
  resetCatalogToDefaults,
  GENRE_MAP,
  type VideoCatalogItem,
} from "@/lib/videoCatalog";

import {
  getAnalyticsSummary,
  getViewsTimeline,
  getTopVideosAnalytics,
  exportAnalyticsCSV,
  resetAnalyticsData,
  type VideoAnalyticsSummary,
  type DailyViewData,
  type TopVideoStats,
} from "@/lib/analytics";

import {
  getAllPlans,
  fetchServerPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  togglePlanStatus,
  resetPlansToDefaults,
  type SubscriptionPlanItem,
} from "@/lib/plansStore";

import {
  getAllAdminUsers,
  fetchServerAdminUsers,
  createAdminUser,
  deleteAdminUser,
  toggleUserStatus,
  updateUserSubscription,
  extendUserSubscription,
  grantVIPPass,
  toggleCancelSubscription,
  getSubscriptionAnalytics,
  getPlanConfig,
  type AdminManagedUser,
  type UserSubscriptionDetails,
} from "@/lib/adminUsers";

// Sample video stream presets for easy testing
const VIDEO_STREAM_PRESETS = [
  { name: "Big Buck Bunny (4K Animation)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { name: "Elephants Dream (Sci-Fi Animation)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
  { name: "For Bigger Blazes (Action Clip)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { name: "For Bigger Escapes (Adventure Clip)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { name: "Sintel (Fantasy CGI)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
  { name: "Tears of Steel (Sci-Fi VFX)", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
  { name: "Oceans Nature Documentary", url: "https://vjs.zencdn.net/v/oceans.mp4" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [admin] = useState<AdminUser | null>(getAdminSession());

  // Active Admin Tab: 'overview' | 'videos' | 'analytics' | 'users' | 'subscriptions' | 'settings'
  const [activeTab, setActiveTab] = useState<"overview" | "videos" | "analytics" | "users" | "subscriptions" | "settings">("overview");

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState<VideoCatalogItem[]>([]);
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(getAllPlans());
  const [analyticsSummary, setAnalyticsSummary] = useState<VideoAnalyticsSummary | null>(null);
  const [subAnalytics, setSubAnalytics] = useState(getSubscriptionAnalytics());
  const [viewsTimeline, setViewsTimeline] = useState<DailyViewData[]>([]);
  const [topVideos, setTopVideos] = useState<TopVideoStats[]>([]);
  const [timelineDays, setTimelineDays] = useState<number>(14);

  // Reload all data from storage & backend API
  const reloadData = async () => {
    setVideos(getCatalogVideos());
    setUsers(getAllAdminUsers());
    setPlans(getAllPlans());
    setAnalyticsSummary(getAnalyticsSummary());
    setSubAnalytics(getSubscriptionAnalytics());
    setViewsTimeline(getViewsTimeline(timelineDays));
    setTopVideos(getTopVideosAnalytics(15));

    // Fetch live backend server data asynchronously
    try {
      const [fetchedUsers, fetchedCatalog, fetchedPlans] = await Promise.all([
        fetchServerAdminUsers(),
        fetchServerCatalog(),
        fetchServerPlans(),
      ]);
      setUsers(fetchedUsers);
      setVideos(fetchedCatalog);
      setPlans(fetchedPlans);
      setSubAnalytics(getSubscriptionAnalytics());
      setAnalyticsSummary(getAnalyticsSummary());
    } catch {
      // Fallback already set above
    }
  };

  useEffect(() => {
    reloadData();

    const handleCatalogChange = () => reloadData();
    const handleUsersChange = () => reloadData();
    const handlePlansChange = () => reloadData();
    const handleAnalyticsChange = () => reloadData();

    window.addEventListener("streamly:catalog-change", handleCatalogChange);
    window.addEventListener("streamly:users-change", handleUsersChange);
    window.addEventListener("streamly:plans-change", handlePlansChange);
    window.addEventListener("streamly:analytics-change", handleAnalyticsChange);

    return () => {
      window.removeEventListener("streamly:catalog-change", handleCatalogChange);
      window.removeEventListener("streamly:users-change", handleUsersChange);
      window.removeEventListener("streamly:plans-change", handlePlansChange);
      window.removeEventListener("streamly:analytics-change", handleAnalyticsChange);
    };
  }, [timelineDays]);

  // Handle Logout
  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  // ─── Videos CRUD State & Modals ─────────────────────────────────────────────
  const [videoSearch, setVideoSearch] = useState("");
  const [videoTypeFilter, setVideoTypeFilter] = useState<"all" | "movie" | "tv">("all");
  const [videoGenreFilter, setVideoGenreFilter] = useState<string>("all");
  const [videoSortBy, setVideoSortBy] = useState<"views" | "rating" | "title" | "year">("views");
  const [videoViewMode, setVideoViewMode] = useState<"grid" | "table">("grid");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoCatalogItem | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<VideoCatalogItem | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoCatalogItem | null>(null);

  // Form state for Add/Edit Video
  const [formData, setFormData] = useState({
    title: "",
    media_type: "movie" as "movie" | "tv",
    overview: "",
    backdrop_path: "",
    poster_path: "",
    videoUrl: VIDEO_STREAM_PRESETS[0].url,
    vote_average: 8.0,
    durationMinutes: 120,
    year: new Date().getFullYear(),
    quality: "4K UHD" as "4K UHD" | "1080p Full HD" | "720p HD",
    genre_ids: [878, 12] as number[],
    viewsCount: 1500,
  });

  const openAddModal = () => {
    setFormData({
      title: "",
      media_type: "movie",
      overview: "",
      backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
      poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      videoUrl: VIDEO_STREAM_PRESETS[0].url,
      vote_average: 8.2,
      durationMinutes: 125,
      year: new Date().getFullYear(),
      quality: "4K UHD",
      genre_ids: [878, 12],
      viewsCount: 1200,
    });
    setEditingVideo(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: VideoCatalogItem) => {
    setEditingVideo(item);
    setFormData({
      title: item.title || (item.name ?? ""),
      media_type: item.media_type || "movie",
      overview: item.overview || "",
      backdrop_path: item.backdrop_path || "",
      poster_path: item.poster_path || "",
      videoUrl: item.videoUrl || VIDEO_STREAM_PRESETS[0].url,
      vote_average: item.vote_average || 8.0,
      durationMinutes: item.durationMinutes || 120,
      year: item.year || (item.release_date ? parseInt(item.release_date.slice(0, 4)) : 2024),
      quality: item.quality || "4K UHD",
      genre_ids: item.genre_ids || [28],
      viewsCount: item.viewsCount || 0,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveVideo = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Please enter a video title.", "error");
      return;
    }

    if (editingVideo) {
      updateVideo(editingVideo.id, {
        title: formData.title,
        media_type: formData.media_type,
        overview: formData.overview,
        backdrop_path: formData.backdrop_path,
        poster_path: formData.poster_path,
        videoUrl: formData.videoUrl,
        vote_average: Number(formData.vote_average),
        durationMinutes: Number(formData.durationMinutes),
        year: Number(formData.year),
        quality: formData.quality,
        genre_ids: formData.genre_ids,
        viewsCount: Number(formData.viewsCount),
      });
      showToast(`Updated "${formData.title}" successfully!`);
    } else {
      createVideo({
        title: formData.title,
        media_type: formData.media_type,
        overview: formData.overview,
        backdrop_path: formData.backdrop_path,
        poster_path: formData.poster_path,
        videoUrl: formData.videoUrl,
        vote_average: Number(formData.vote_average),
        durationMinutes: Number(formData.durationMinutes),
        year: Number(formData.year),
        quality: formData.quality,
        genre_ids: formData.genre_ids,
        viewsCount: Number(formData.viewsCount),
      });
      showToast(`Added "${formData.title}" to catalog!`);
    }

    setIsAddModalOpen(false);
    reloadData();
  };

  const handleDeleteVideoConfirm = () => {
    if (!deletingVideo) return;
    deleteVideo(deletingVideo.id);
    showToast(`Deleted "${deletingVideo.title || deletingVideo.name}" from catalog.`, "info");
    setDeletingVideo(null);
    reloadData();
  };

  // Filtered & Sorted Videos
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        const title = (v.title || v.name || "").toLowerCase();
        const overview = (v.overview || "").toLowerCase();
        const matchesQuery = !videoSearch || title.includes(videoSearch.toLowerCase()) || overview.includes(videoSearch.toLowerCase());
        const matchesType = videoTypeFilter === "all" || v.media_type === videoTypeFilter;
        const matchesGenre =
          videoGenreFilter === "all" ||
          (v.genre_ids && v.genre_ids.some((id) => GENRE_MAP[id]?.toLowerCase() === videoGenreFilter.toLowerCase()));
        return matchesQuery && matchesType && matchesGenre;
      })
      .sort((a, b) => {
        if (videoSortBy === "views") return (b.viewsCount || 0) - (a.viewsCount || 0);
        if (videoSortBy === "rating") return (b.vote_average || 0) - (a.vote_average || 0);
        if (videoSortBy === "year") return (b.year || 2024) - (a.year || 2024);
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      });
  }, [videos, videoSearch, videoTypeFilter, videoGenreFilter, videoSortBy]);

  // ─── Users State & Modals ───────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminManagedUser | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    planId: "premium",
    status: "active" as "active" | "suspended",
  });

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      showToast("Please enter user name and valid email.", "error");
      return;
    }
    createAdminUser({
      name: newUserForm.name,
      email: newUserForm.email,
      planId: newUserForm.planId,
      status: newUserForm.status,
    });
    showToast(`User ${newUserForm.name} created successfully!`);
    setIsAddUserModalOpen(false);
    setNewUserForm({ name: "", email: "", planId: "premium", status: "active" });
    reloadData();
  };

  const handleDeleteUserConfirm = () => {
    if (!deletingUser) return;
    deleteAdminUser(deletingUser.id);
    showToast(`User "${deletingUser.name}" has been deleted.`, "info");
    setDeletingUser(null);
    reloadData();
  };

  const handleToggleUserStatus = (id: string) => {
    const res = toggleUserStatus(id);
    if (res) {
      showToast(`User status updated to ${res.status.toUpperCase()}.`);
      reloadData();
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchPlan = userPlanFilter === "all" || u.planId === userPlanFilter;
      const matchStatus = userStatusFilter === "all" || u.status === userStatusFilter;
      return matchQuery && matchPlan && matchStatus;
    });
  }, [users, userSearch, userPlanFilter, userStatusFilter]);

  // ─── Subscriptions & Plans State ───────────────────────────────────────────
  const [subSearch, setSubSearch] = useState("");
  const [subPlanFilter, setSubPlanFilter] = useState<string>("all");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [subTabMode, setSubTabMode] = useState<"plans" | "subscribers">("plans");

  // Managing Single Subscriber Modal
  const [managingSubUser, setManagingSubUser] = useState<AdminManagedUser | null>(null);
  const [subForm, setSubForm] = useState<{
    planId: string;
    status: UserSubscriptionDetails["status"];
    expiryDate: string;
    cardBrand: string;
    cardLast4: string;
  }>({
    planId: "premium",
    status: "active",
    expiryDate: "",
    cardBrand: "visa",
    cardLast4: "4242",
  });

  const openManageSubModal = (user: AdminManagedUser) => {
    setManagingSubUser(user);
    const sub = user.subscription;
    setSubForm({
      planId: sub?.planId || user.planId || "premium",
      status: sub?.status || "active",
      expiryDate: sub?.currentPeriodEnd ? sub.currentPeriodEnd.split("T")[0] : new Date().toISOString().split("T")[0],
      cardBrand: sub?.cardBrand || "visa",
      cardLast4: sub?.cardLast4 || "4242",
    });
  };

  const handleSaveSubscription = (e: FormEvent) => {
    e.preventDefault();
    if (!managingSubUser) return;

    const expiryISO = subForm.expiryDate
      ? new Date(subForm.expiryDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const planCfg = getPlanConfig(subForm.planId);

    updateUserSubscription(
      managingSubUser.id,
      subForm.planId,
      subForm.status,
      expiryISO,
      subForm.cardBrand,
      subForm.cardLast4
    );

    showToast(`Updated subscription for ${managingSubUser.name} to ${planCfg.name}!`);
    setManagingSubUser(null);
    reloadData();
  };

  // ─── Plan CRUD State & Modals ──────────────────────────────────────────────
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlanItem | null>(null);

  const [planFormData, setPlanFormData] = useState({
    name: "",
    monthlyAmount: 499,
    durationDays: 30,
    durationLabel: "1 Month (30 Days)",
    quality: "Best",
    resolution: "4K + HDR Ultra HD",
    screens: "4 Screens at once",
    specs: "Ultra HD 4K + HDR (4 Screens at once)",
    featuresText: "TV, Computer, Phone, Tablet\n4K Ultra HD + Dolby Vision\nSpatial Audio Included\n6 Download Devices",
    isPopular: false,
  });

  const openAddPlanModal = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: "",
      monthlyAmount: 399,
      durationDays: 30,
      durationLabel: "1 Month (30 Days)",
      quality: "Great",
      resolution: "1080p Full HD",
      screens: "2 Screens at once",
      specs: "Full HD 1080p (2 Screens at once)",
      featuresText: "TV, Computer, Phone, Tablet\n1080p Full HD Video Quality\n2 Download Devices\nUnlimited Movies & Shows",
      isPopular: false,
    });
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      monthlyAmount: plan.monthlyAmount,
      durationDays: plan.durationDays || 30,
      durationLabel: plan.durationLabel || "1 Month (30 Days)",
      quality: plan.quality || "Great",
      resolution: plan.resolution || "1080p Full HD",
      screens: plan.screens || "2 Screens at once",
      specs: plan.specs || "",
      featuresText: plan.features?.join("\n") || "Ad-Free Streaming\nUnlimited Movies & Shows",
      isPopular: !!plan.isPopular,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: FormEvent) => {
    e.preventDefault();
    if (!planFormData.name.trim()) {
      showToast("Please enter a plan name.", "error");
      return;
    }

    const features = planFormData.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingPlan) {
      updateSubscriptionPlan(editingPlan.id, {
        name: planFormData.name,
        monthlyAmount: Number(planFormData.monthlyAmount),
        durationDays: Number(planFormData.durationDays),
        durationLabel: planFormData.durationLabel,
        quality: planFormData.quality,
        resolution: planFormData.resolution,
        screens: planFormData.screens,
        specs: planFormData.specs || `${planFormData.resolution} (${planFormData.screens})`,
        features,
        isPopular: planFormData.isPopular,
      });
      showToast(`Updated plan "${planFormData.name}"!`);
    } else {
      createSubscriptionPlan({
        name: planFormData.name,
        monthlyAmount: Number(planFormData.monthlyAmount),
        durationDays: Number(planFormData.durationDays),
        durationLabel: planFormData.durationLabel,
        quality: planFormData.quality,
        resolution: planFormData.resolution,
        screens: planFormData.screens,
        specs: planFormData.specs || `${planFormData.resolution} (${planFormData.screens})`,
        features,
        isPopular: planFormData.isPopular,
      });
      showToast(`Created new plan "${planFormData.name}"!`);
    }

    setIsPlanModalOpen(false);
    reloadData();
  };

  const handleDeletePlanConfirm = () => {
    if (!deletingPlan) return;
    deleteSubscriptionPlan(deletingPlan.id);
    showToast(`Deleted plan "${deletingPlan.name}".`, "info");
    setDeletingPlan(null);
    reloadData();
  };

  const handleTogglePlanActive = (id: string) => {
    const res = togglePlanStatus(id);
    if (res) {
      showToast(`Plan "${res.name}" status is now ${res.isActive ? "ACTIVE" : "INACTIVE"}.`);
      reloadData();
    }
  };

  const handleQuickExtend = (userId: string, days = 30) => {
    const res = extendUserSubscription(userId, days);
    if (res) {
      showToast(`Extended ${res.name}'s plan by +${days} days!`);
      reloadData();
    }
  };

  const handleGrantVIP = (userId: string) => {
    const res = grantVIPPass(userId);
    if (res) {
      showToast(`Granted 3-Year VIP 4K Pass to ${res.name}!`);
      reloadData();
    }
  };

  const handleToggleSubCancel = (userId: string) => {
    const res = toggleCancelSubscription(userId);
    if (res) {
      showToast(`Subscription status for ${res.name} updated to ${res.subscription.status.toUpperCase()}.`);
      reloadData();
    }
  };

  const filteredSubUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !subSearch ||
        u.name.toLowerCase().includes(subSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(subSearch.toLowerCase());
      const matchPlan = subPlanFilter === "all" || u.planId === subPlanFilter;
      const matchStatus = subStatusFilter === "all" || u.subscription?.status === subStatusFilter;
      return matchQuery && matchPlan && matchStatus;
    });
  }, [users, subSearch, subPlanFilter, subStatusFilter]);

  // ─── Settings State ─────────────────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    const res = await updateAdminPassword(oldPassword, newPassword);
    if (res.ok) {
      showToast("Admin password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showToast(res.error || "Password update failed.", "error");
    }
  };

  // Helper for genre tag toggle
  const toggleGenre = (genreId: number) => {
    setFormData((prev) => {
      const exists = prev.genre_ids.includes(genreId);
      const next = exists ? prev.genre_ids.filter((g) => g !== genreId) : [...prev.genre_ids, genreId];
      return { ...prev, genre_ids: next };
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col antialiased selection:bg-[#e50914] selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border font-medium text-sm ${
              toastMessage.type === "error"
                ? "bg-red-950/90 border-red-700 text-red-100"
                : toastMessage.type === "info"
                ? "bg-sky-950/90 border-sky-700 text-sky-100"
                : "bg-emerald-950/90 border-emerald-700 text-emerald-100"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertTriangle className="size-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-[#121212]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#e50914] to-red-900 grid place-items-center shadow-md shadow-red-900/40 border border-red-500/30 group-hover:scale-105 transition-transform">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tighter text-white">STREAMLY</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 text-[#ff4b55]">
                  Studio Admin
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/browse"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <span>Live Storefront</span>
            <ExternalLink className="size-3.5 text-gray-400" />
          </Link>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="size-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 grid place-items-center text-xs font-bold shadow">
              {admin?.name?.[0] || "A"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight text-white">{admin?.name || "Administrator"}</p>
              <p className="text-[10px] text-gray-400">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out of Admin"
              aria-label="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Tab Navigation Sub-Header */}
      <div className="sticky top-16 z-30 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-md px-4 sm:px-8 py-2.5">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="size-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "videos"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Film className="size-4" />
              <span>Video Manager</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 text-gray-300">
                {videos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <TrendingUp className="size-4" />
              <span>Views Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="size-4" />
              <span>Users</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 text-gray-300">
                {users.length}
              </span>
            </button>

            {/* Subscriptions Tab */}
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "subscriptions"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="size-4" />
              <span>Subscriptions & Pricing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ₹{subAnalytics.totalMRR.toLocaleString("en-IN")}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Tab Action */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "videos" && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>Add Video</span>
              </button>
            )}
            {activeTab === "users" && (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
              >
                <UserPlus className="size-4" />
                <span>Add User</span>
              </button>
            )}
            {activeTab === "subscriptions" && (
              <button
                onClick={openAddPlanModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>Create New Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* ========================================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total Views Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Video Views</span>
                  <div className="size-10 rounded-2xl bg-red-500/15 border border-red-500/30 grid place-items-center">
                    <Eye className="size-5 text-[#e50914]" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {(analyticsSummary?.totalViews || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    +14.8% <TrendingUp className="size-3 ml-0.5" />
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">Across all movies & TV shows</p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-red-600/10 blur-2xl pointer-events-none" />
              </div>

              {/* Monthly Subscription MRR Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl cursor-pointer" onClick={() => setActiveTab("subscriptions")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly Revenue (MRR)</span>
                  <div className="size-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 grid place-items-center">
                    <CreditCard className="size-5 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-emerald-400">
                    ₹{subAnalytics.totalMRR.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">+15.2%</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {subAnalytics.activeSubscribers} Active paying members
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />
              </div>

              {/* Catalog Size Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Video Library</span>
                  <div className="size-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 grid place-items-center">
                    <Film className="size-5 text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">{videos.length}</span>
                  <span className="text-xs font-medium text-gray-400">Active Titles</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {videos.filter((v) => v.media_type === "movie").length} Movies &bull; {videos.filter((v) => v.media_type === "tv").length} Series
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-purple-600/10 blur-2xl pointer-events-none" />
              </div>

              {/* Registered Users Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registered Users</span>
                  <div className="size-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 grid place-items-center">
                    <Users className="size-5 text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">{users.length}</span>
                  <span className="text-xs font-bold text-emerald-400">+12% new</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {plans.length} Active Pricing Tiers Configured
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
              </div>
            </div>

            {/* Views Trend Visual Chart & Top Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline Chart Area */}
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Daily View Trends</h2>
                    <p className="text-xs text-gray-400">Playback traffic over the past 14 days</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                    Live Streamly Data
                  </span>
                </div>

                {/* SVG Visual Bar Chart */}
                <div className="mt-4 h-52 w-full flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-2">
                  {viewsTimeline.map((item, idx) => {
                    const maxVal = Math.max(...viewsTimeline.map((t) => t.views), 1);
                    const heightPercent = Math.max(12, Math.round((item.views / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] text-white px-2 py-1 rounded border border-white/20 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          <strong>{item.views.toLocaleString()}</strong> views &bull; {item.dayLabel}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-red-800 to-[#e50914] group-hover:from-red-600 group-hover:to-red-400 transition-all duration-300 shadow-md shadow-red-950"
                        />
                        <span className="text-[9px] sm:text-[10px] text-gray-500 truncate w-full text-center">
                          {item.dayLabel.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 Videos Leaderboard */}
              <div className="rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">Top Performing Videos</h2>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="text-xs font-semibold text-red-400 hover:text-red-300"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3 flex-1">
                  {topVideos.slice(0, 5).map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all"
                    >
                      <span className="font-mono text-xs font-bold text-gray-500 w-4 text-center">#{i + 1}</span>
                      <div className="size-10 rounded-xl overflow-hidden bg-black shrink-0 relative">
                        <img
                          src={
                            v.poster_path?.startsWith("http")
                              ? v.poster_path
                              : `https://image.tmdb.org/t/p/w200${v.poster_path || v.backdrop_path}`
                          }
                          alt={v.title}
                          className="size-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{v.title}</p>
                        <p className="text-[11px] text-gray-400">
                          {v.viewsCount.toLocaleString()} views &bull; {v.vote_average.toFixed(1)} ★
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const matched = videos.find((item) => item.id === v.id);
                          if (matched) setPreviewVideo(matched);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600 hover:text-white text-gray-400 transition-colors"
                        title="Preview"
                      >
                        <Play className="size-3.5 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: VIDEO MANAGER (FULL CRUD) */}
        {/* ========================================================================= */}
        {activeTab === "videos" && (
          <div className="space-y-6">
            {/* Search, Filter and Actions Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#161616] p-4 rounded-3xl border border-white/10">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  placeholder="Search video titles, synopsis, tags..."
                  className="w-full rounded-2xl bg-white/[0.06] border border-white/10 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none"
                />
                {videoSearch && (
                  <button
                    onClick={() => setVideoSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={videoTypeFilter}
                  onChange={(e) => setVideoTypeFilter(e.target.value as "all" | "movie" | "tv")}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value="all" className="bg-[#1a1a1a]">All Formats</option>
                  <option value="movie" className="bg-[#1a1a1a]">Movies Only</option>
                  <option value="tv" className="bg-[#1a1a1a]">TV Shows Only</option>
                </select>

                <select
                  value={videoGenreFilter}
                  onChange={(e) => setVideoGenreFilter(e.target.value)}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value="all" className="bg-[#1a1a1a]">All Genres</option>
                  {Object.values(GENRE_MAP).map((genre) => (
                    <option key={genre} value={genre} className="bg-[#1a1a1a]">
                      {genre}
                    </option>
                  ))}
                </select>

                <select
                  value={videoSortBy}
                  onChange={(e) => setVideoSortBy(e.target.value as "views" | "rating" | "title" | "year")}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value="views" className="bg-[#1a1a1a]">Sort by Views</option>
                  <option value="rating" className="bg-[#1a1a1a]">Sort by Rating</option>
                  <option value="year" className="bg-[#1a1a1a]">Sort by Year</option>
                  <option value="title" className="bg-[#1a1a1a]">Sort by Title</option>
                </select>

                <div className="flex items-center rounded-2xl bg-white/[0.06] border border-white/10 p-1">
                  <button
                    onClick={() => setVideoViewMode("grid")}
                    className={`p-1.5 rounded-xl transition-colors ${videoViewMode === "grid" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setVideoViewMode("table")}
                    className={`p-1.5 rounded-xl transition-colors ${videoViewMode === "table" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                    title="Table View"
                  >
                    <List className="size-3.5" />
                  </button>
                </div>

                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#e50914] hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Add Video</span>
                </button>
              </div>
            </div>

            {/* Video Grid / Table */}
            {videoViewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <motion.div
                    layout
                    key={video.id}
                    className="group rounded-3xl border border-white/10 bg-[#161616] overflow-hidden shadow-xl flex flex-col hover:border-red-500/50 transition-all duration-300"
                  >
                    <div className="relative aspect-video w-full bg-black overflow-hidden">
                      <img
                        src={
                          video.backdrop_path?.startsWith("http")
                            ? video.backdrop_path
                            : `https://image.tmdb.org/t/p/w500${video.backdrop_path || video.poster_path}`
                        }
                        alt={video.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-black/80 text-white border border-white/20 backdrop-blur-sm">
                          {video.media_type === "tv" ? "TV Series" : "Movie"}
                        </span>
                        {video.quality && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white shadow-sm">
                            {video.quality}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="absolute inset-0 m-auto size-12 rounded-full bg-[#e50914]/90 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-xl"
                        title="Preview Stream"
                      >
                        <Play className="size-5 fill-current ml-0.5" />
                      </button>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
                        <span className="flex items-center gap-1 text-amber-400">
                          ★ {(video.vote_average || 8.0).toFixed(1)}
                        </span>
                        <span className="text-gray-300 text-[11px]">
                          {video.year || 2024} &bull; {video.durationMinutes || 120}m
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-sm text-white truncate">{video.title || video.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {video.overview || "No synopsis available."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {video.genre_ids?.slice(0, 3).map((gId) => (
                          <span key={gId} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/5 text-gray-400 border border-white/10">
                            {GENRE_MAP[gId] || "Drama"}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Eye className="size-3.5 text-red-400" />
                          <span>{(video.viewsCount || 0).toLocaleString()} views</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(video)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                            title="Edit Video"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVideo(video)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-[#161616] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Title & Poster</th>
                        <th className="py-3 px-4">Format</th>
                        <th className="py-3 px-4">Rating</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Views</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredVideos.map((video) => (
                        <tr key={video.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="size-10 rounded-lg overflow-hidden bg-black shrink-0">
                              <img
                                src={
                                  video.poster_path?.startsWith("http")
                                    ? video.poster_path
                                    : `https://image.tmdb.org/t/p/w200${video.poster_path || video.backdrop_path}`
                                }
                                alt={video.title}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{video.title || video.name}</p>
                              <p className="text-[10px] text-gray-500">{video.year || 2024}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                              {video.media_type === "tv" ? "TV Series" : "Movie"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-amber-400">
                            ★ {(video.vote_average || 8.0).toFixed(1)}
                          </td>
                          <td className="py-3 px-4">{video.durationMinutes || 120}m</td>
                          <td className="py-3 px-4 font-mono font-medium text-white">
                            {(video.viewsCount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewVideo(video)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600 hover:text-white text-gray-400"
                                title="Play Video"
                              >
                                <Play className="size-3.5 fill-current" />
                              </button>
                              <button
                                onClick={() => openEditModal(video)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white"
                                title="Edit"
                              >
                                <Edit className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingVideo(video)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VIEWS & PLAYBACK ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161616] p-4 rounded-3xl border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Catalog Video Views & Engagement</h2>
                <p className="text-xs text-gray-400">Detailed metric breakdown and playback session logs</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(Number(e.target.value))}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value={7} className="bg-[#1a1a1a]">Last 7 Days</option>
                  <option value={14} className="bg-[#1a1a1a]">Last 14 Days</option>
                  <option value={30} className="bg-[#1a1a1a]">Last 30 Days</option>
                </select>

                <button
                  onClick={exportAnalyticsCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#e50914] hover:bg-red-500 text-white text-xs font-bold shadow transition-all"
                >
                  <Download className="size-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Video View Count Rankings Table */}
            <div className="rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4">Video Views Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Video Title</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Total Views</th>
                      <th className="py-3 px-4">Avg Watch Time</th>
                      <th className="py-3 px-4">Completion %</th>
                      <th className="py-3 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topVideos.map((v, i) => (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-500">#{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                          <div className="size-8 rounded-lg overflow-hidden bg-black shrink-0">
                            <img
                              src={
                                v.poster_path?.startsWith("http")
                                  ? v.poster_path
                                  : `https://image.tmdb.org/t/p/w200${v.poster_path || v.backdrop_path}`
                              }
                              alt={v.title}
                              className="size-full object-cover"
                            />
                          </div>
                          <span>{v.title}</span>
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] font-semibold text-gray-400">
                          {v.mediaType}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-400">
                          {v.viewsCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">{v.avgWatchMinutes} mins</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                              <div
                                style={{ width: `${v.completionRate}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-red-600 to-emerald-500"
                              />
                            </div>
                            <span className="font-mono text-[11px]">{v.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-amber-400">★ {v.vote_average.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USERS MANAGEMENT (VIEW & DELETE) */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#161616] p-4 rounded-3xl border border-white/10">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, plan..."
                  className="w-full rounded-2xl bg-white/[0.06] border border-white/10 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value="all" className="bg-[#1a1a1a]">All Plans</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                      {p.name} ({p.price})
                    </option>
                  ))}
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                >
                  <option value="all" className="bg-[#1a1a1a]">All Statuses</option>
                  <option value="active" className="bg-[#1a1a1a]">Active</option>
                  <option value="suspended" className="bg-[#1a1a1a]">Suspended</option>
                </select>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#e50914] hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
                >
                  <UserPlus className="size-4" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl border border-white/10 bg-[#161616] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Subscription Plan</th>
                      <th className="py-3.5 px-4">Provider</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Activity</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => {
                      const planCfg = getPlanConfig(user.planId);
                      return (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div
                              style={{ background: user.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                              className="size-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0 shadow"
                            >
                              {user.name?.[0] || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{user.name}</p>
                              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openManageSubModal(user)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-transform hover:scale-105 bg-purple-950/80 text-purple-300 border border-purple-700/50"
                              title="Manage Subscription"
                            >
                              {planCfg.name} &bull; {planCfg.price} ✏️
                            </button>
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] font-mono text-gray-400">
                            {user.authProvider}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                user.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-[11px]">{user.lastActive}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openManageSubModal(user)}
                                className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:text-white text-purple-300 text-[11px] font-semibold border border-purple-500/30 transition-colors"
                                title="Manage Subscription"
                              >
                                Subscription
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-[11px] font-semibold transition-colors"
                              >
                                {user.status === "active" ? "Suspend" : "Activate"}
                              </button>
                              <button
                                onClick={() => setDeletingUser(user)}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SUBSCRIPTION PLANS & MEMBERSHIP HUB */}
        {/* ========================================================================= */}
        {activeTab === "subscriptions" && (
          <div className="space-y-8">
            {/* Top Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Monthly MRR</span>
                  <div className="size-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-emerald-400 font-bold">
                    ₹
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">
                    ₹{subAnalytics.totalMRR.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-gray-400">/ mo</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">ARR: ₹{(subAnalytics.annualRunRate).toLocaleString("en-IN")} / yr</p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Paying Subscribers</span>
                  <Crown className="size-5 text-purple-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{subAnalytics.activeSubscribers}</span>
                  <span className="text-xs font-bold text-purple-400">Active Accounts</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  ARPU: ₹{subAnalytics.arpu} / subscriber
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-purple-600/10 blur-2xl pointer-events-none" />
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Configured Plans</span>
                  <Zap className="size-5 text-sky-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{plans.length}</span>
                  <span className="text-xs font-bold text-sky-400">Tiers Available</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {plans.filter((p) => p.isActive).length} active for checkout
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-sky-600/10 blur-2xl pointer-events-none" />
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#181818] to-[#111111] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">At-Risk / Past Due</span>
                  <AlertTriangle className="size-5 text-amber-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">{subAnalytics.pastDueSubscribers}</span>
                  <span className="text-xs font-bold text-amber-400">Subscribers</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {subAnalytics.canceledSubscribers} canceled accounts
                </p>
                <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />
              </div>
            </div>

            {/* Subscriptions Sub-Navigation Switcher */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubTabMode("plans")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    subTabMode === "plans"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-950"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Sliders className="size-4" />
                  <span>Subscription Plans & Pricing ({plans.length})</span>
                </button>

                <button
                  onClick={() => setSubTabMode("subscribers")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    subTabMode === "subscribers"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-950"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Users className="size-4" />
                  <span>Manage Subscribers ({users.length})</span>
                </button>
              </div>

              {subTabMode === "plans" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      resetPlansToDefaults();
                      showToast("Plans reset to default tiers.");
                      reloadData();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium border border-white/10 transition-colors"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={openAddPlanModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#e50914] hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950 transition-all hover:scale-105"
                  >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>Add New Plan</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIEW A: SUBSCRIPTION PLANS CRUD MANAGER */}
            {subTabMode === "plans" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const subscriberCount = users.filter((u) => u.planId === plan.id).length;
                    return (
                      <motion.div
                        layout
                        key={plan.id}
                        className={`rounded-3xl border p-6 flex flex-col justify-between space-y-5 relative overflow-hidden shadow-xl transition-all ${
                          plan.isActive
                            ? "bg-[#161616] border-white/10 hover:border-purple-500/50"
                            : "bg-[#121212] border-white/5 opacity-60"
                        }`}
                      >
                        {plan.isPopular && (
                          <span className="absolute top-0 right-0 px-3 py-1 rounded-bl-2xl bg-[#e50914] text-white text-[10px] font-black uppercase tracking-wider shadow">
                            POPULAR
                          </span>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pr-12">
                            <div>
                              <h3 className="font-extrabold text-lg text-white">{plan.name}</h3>
                              <p className="text-xs text-purple-400 font-medium">{plan.durationLabel}</p>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2 pt-2 border-t border-white/10">
                            <span className="text-2xl font-black text-white">{plan.price}</span>
                            <span className="text-xs text-gray-400">({plan.durationDays} days)</span>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-300">
                            <p className="font-semibold text-white flex items-center gap-1.5">
                              <Sparkles className="size-3 text-amber-400" />
                              <span>{plan.quality} Quality &bull; {plan.resolution}</span>
                            </p>
                            <p className="text-gray-400">{plan.screens}</p>
                          </div>

                          <div className="pt-2 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Features</span>
                            <ul className="space-y-1">
                              {plan.features?.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-[11px] text-gray-300">
                                  <Check className="size-3 text-emerald-400 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            <strong className="text-white font-mono">{subscriberCount}</strong> subscribers
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTogglePlanActive(plan.id)}
                              className={`px-2 py-1 rounded-xl text-[10px] font-semibold border transition-colors ${
                                plan.isActive
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : "bg-gray-800 border-gray-700 text-gray-400"
                              }`}
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </button>

                            <button
                              onClick={() => openEditPlanModal(plan)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                              title="Edit Plan"
                            >
                              <Edit className="size-3.5" />
                            </button>

                            {plan.isCustom && (
                              <button
                                onClick={() => setDeletingPlan(plan)}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 transition-colors"
                                title="Delete Custom Plan"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW B: SUBSCRIBERS DIRECTORY & ACTIONS */}
            {subTabMode === "subscribers" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#161616] p-4 rounded-3xl border border-white/10">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      placeholder="Search subscriber by name or email..."
                      className="w-full rounded-2xl bg-white/[0.06] border border-white/10 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={subPlanFilter}
                      onChange={(e) => setSubPlanFilter(e.target.value)}
                      className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="all" className="bg-[#1a1a1a]">All Plans</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                          {p.name} ({p.price})
                        </option>
                      ))}
                    </select>

                    <select
                      value={subStatusFilter}
                      onChange={(e) => setSubStatusFilter(e.target.value)}
                      className="rounded-2xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="all" className="bg-[#1a1a1a]">All Statuses</option>
                      <option value="active" className="bg-[#1a1a1a]">Active</option>
                      <option value="past_due" className="bg-[#1a1a1a]">Past Due</option>
                      <option value="canceled" className="bg-[#1a1a1a]">Canceled</option>
                      <option value="trial" className="bg-[#1a1a1a]">Trial</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#161616] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-black/50 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-3.5 px-4">Subscriber</th>
                          <th className="py-3.5 px-4">Plan & Price</th>
                          <th className="py-3.5 px-4">Billing Status</th>
                          <th className="py-3.5 px-4">Payment Method</th>
                          <th className="py-3.5 px-4">Renews / Expires</th>
                          <th className="py-3.5 px-4 text-right">Subscription Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSubUsers.map((user) => {
                          const sub = user.subscription;
                          const planCfg = getPlanConfig(user.planId);
                          const expiryDate = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
                          const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;

                          return (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <div
                                  style={{ background: user.avatar || "linear-gradient(135deg,#0072d2,#62d5ff)" }}
                                  className="size-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0 shadow"
                                >
                                  {user.name?.[0] || "U"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-white truncate">{user.name}</p>
                                    {sub?.isComplimentary && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-700/50">
                                  {planCfg.name} &bull; {planCfg.price}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    sub?.status === "active"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : sub?.status === "past_due"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                                  }`}
                                >
                                  {sub?.status || "Active"}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-mono text-[11px] text-gray-300">
                                <span className="uppercase font-bold text-gray-400 mr-1">{sub?.cardBrand || "VISA"}</span>
                                •••• {sub?.cardLast4 || "4242"}
                              </td>

                              <td className="py-3 px-4 text-[11px]">
                                {expiryDate ? (
                                  <span className={isExpired ? "text-red-400 font-semibold" : "text-gray-300"}>
                                    {expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Auto-Renews</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openManageSubModal(user)}
                                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-[#e50914] text-white text-[11px] font-bold border border-white/10 transition-colors shadow-sm"
                                    title="Change Plan & Status"
                                  >
                                    Modify Plan
                                  </button>
                                  <button
                                    onClick={() => handleQuickExtend(user.id, 30)}
                                    className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-[10px] font-semibold transition-colors"
                                    title="Extend 30 Days"
                                  >
                                    +30d
                                  </button>
                                  <button
                                    onClick={() => handleGrantVIP(user.id)}
                                    className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 transition-colors"
                                    title="Grant 3-Year VIP 4K Pass"
                                  >
                                    <Crown className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleSubCancel(user.id)}
                                    className={`px-2 py-1 rounded-xl text-[10px] font-semibold transition-colors ${
                                      sub?.status === "active"
                                        ? "bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white"
                                        : "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white"
                                    }`}
                                    title={sub?.status === "active" ? "Cancel Subscription" : "Reactivate Subscription"}
                                  >
                                    {sub?.status === "active" ? "Cancel" : "Reactivate"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ADMIN SETTINGS & SECURITY */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#161616] p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-2xl bg-red-500/15 border border-red-500/30 grid place-items-center">
                  <Key className="size-5 text-[#e50914]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Change Admin Password</h2>
                  <p className="text-xs text-gray-400">Update credentials used to access this console</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password (default: AdminPassword123)"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#e50914] hover:bg-red-500 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-red-950 transition-all"
                >
                  Update Admin Password
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#161616] p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Database & Demo Operations</h2>
                <p className="text-xs text-gray-400">Restore factory catalog or reset sample analytics data</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    resetCatalogToDefaults();
                    showToast("Video catalog reset to factory defaults.");
                    reloadData();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Restore Factory Video Catalog</span>
                </button>

                <button
                  onClick={() => {
                    resetPlansToDefaults();
                    showToast("Subscription plans reset to factory defaults.");
                    reloadData();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Reset Subscription Plans</span>
                </button>

                <button
                  onClick={() => {
                    resetAnalyticsData();
                    showToast("Analytics sessions regenerated.");
                    reloadData();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Regenerate Analytics Traffic</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT VIDEO MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#141414] p-6 sm:p-8 shadow-2xl my-8 overflow-hidden max-h-[90vh] overflow-y-auto modal-scroll"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Film className="size-5 text-[#e50914]" />
                  <span>{editingVideo ? "Edit Video Details" : "Add New Video to Catalog"}</span>
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVideo} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">Video Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Inception: Origins"
                      required
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2.5 px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">Format</label>
                    <select
                      value={formData.media_type}
                      onChange={(e) => setFormData({ ...formData, media_type: e.target.value as "movie" | "tv" })}
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="movie" className="bg-[#1a1a1a]">Movie</option>
                      <option value="tv" className="bg-[#1a1a1a]">TV Show</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-300">Overview / Synopsis</label>
                  <textarea
                    rows={3}
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    placeholder="Enter movie storyline and description..."
                    className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-300">
                    Video Stream Source / Preset
                  </label>
                  <select
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    value={formData.videoUrl}
                    className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  >
                    {VIDEO_STREAM_PRESETS.map((preset, idx) => (
                      <option key={idx} value={preset.url} className="bg-[#1a1a1a]">
                        {preset.name} ({preset.url.slice(-15)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="Or enter custom MP4 / Stream URL"
                    required
                    className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">Backdrop Image Path or URL</label>
                    <input
                      type="text"
                      value={formData.backdrop_path}
                      onChange={(e) => setFormData({ ...formData, backdrop_path: e.target.value })}
                      placeholder="/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-300">Poster Image Path or URL</label>
                    <input
                      type="text"
                      value={formData.poster_path}
                      onChange={(e) => setFormData({ ...formData, poster_path: e.target.value })}
                      placeholder="/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300">Rating (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.vote_average}
                      onChange={(e) => setFormData({ ...formData, vote_average: parseFloat(e.target.value) || 8.0 })}
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300">Duration (Mins)</label>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 120 })}
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300">Release Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300">Quality</label>
                    <select
                      value={formData.quality}
                      onChange={(e) => setFormData({ ...formData, quality: e.target.value as "4K UHD" | "1080p Full HD" | "720p HD" })}
                      className="w-full rounded-xl bg-white/[0.07] border border-white/15 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="4K UHD" className="bg-[#1a1a1a]">4K UHD</option>
                      <option value="1080p Full HD" className="bg-[#1a1a1a]">1080p FHD</option>
                      <option value="720p HD" className="bg-[#1a1a1a]">720p HD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-gray-300">Select Genres</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {Object.entries(GENRE_MAP).map(([idStr, genreName]) => {
                      const id = Number(idStr);
                      const isSelected = formData.genre_ids.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleGenre(id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                            isSelected
                              ? "bg-[#e50914] text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {genreName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#e50914] hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950"
                  >
                    {editingVideo ? "Save Changes" : "Create Video"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT SUBSCRIPTION PLAN MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#141414] p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto modal-scroll"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 grid place-items-center text-purple-300">
                    <Sliders className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}
                    </h3>
                    <p className="text-xs text-gray-400">Configure pricing in INR, duration, and streaming specs</p>
                  </div>
                </div>
                <button onClick={() => setIsPlanModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    placeholder="e.g. Family Pass Ultra 4K"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3.5 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Amount in INR (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={planFormData.monthlyAmount}
                      onChange={(e) => setPlanFormData({ ...planFormData, monthlyAmount: Number(e.target.value) || 0 })}
                      placeholder="e.g. 499"
                      required
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3.5 text-xs text-white font-mono focus:border-[#e50914] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Billing Duration</label>
                    <select
                      value={planFormData.durationDays}
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        const labels: Record<number, string> = {
                          30: "1 Month (30 Days)",
                          90: "3 Months (Quarterly)",
                          180: "6 Months (Half-Yearly)",
                          365: "1 Year (Annual VIP)",
                        };
                        setPlanFormData({
                          ...planFormData,
                          durationDays: days,
                          durationLabel: labels[days] || `${days} Days`,
                        });
                      }}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2.5 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value={30} className="bg-[#1a1a1a]">1 Month (30 Days)</option>
                      <option value={90} className="bg-[#1a1a1a]">3 Months (Quarterly)</option>
                      <option value={180} className="bg-[#1a1a1a]">6 Months (Half-Yearly)</option>
                      <option value={365} className="bg-[#1a1a1a]">1 Year (Annual VIP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Max Resolution</label>
                    <select
                      value={planFormData.resolution}
                      onChange={(e) => setPlanFormData({ ...planFormData, resolution: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="4K + HDR Ultra HD" className="bg-[#1a1a1a]">4K + HDR Ultra HD</option>
                      <option value="1080p Full HD" className="bg-[#1a1a1a]">1080p Full HD</option>
                      <option value="720p HD" className="bg-[#1a1a1a]">720p HD</option>
                      <option value="480p SD" className="bg-[#1a1a1a]">480p SD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Simultaneous Screens</label>
                    <select
                      value={planFormData.screens}
                      onChange={(e) => setPlanFormData({ ...planFormData, screens: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="1 Screen at once" className="bg-[#1a1a1a]">1 Screen at once</option>
                      <option value="2 Screens at once" className="bg-[#1a1a1a]">2 Screens at once</option>
                      <option value="4 Screens at once" className="bg-[#1a1a1a]">4 Screens at once</option>
                      <option value="6 Screens at once" className="bg-[#1a1a1a]">6 Screens at once</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Feature Bullet Points (1 per line)</label>
                  <textarea
                    rows={3}
                    value={planFormData.featuresText}
                    onChange={(e) => setPlanFormData({ ...planFormData, featuresText: e.target.value })}
                    placeholder="Ad-Free Streaming&#10;Download on 4 Devices&#10;Spatial Audio"
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPopularCheck"
                    checked={planFormData.isPopular}
                    onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                    className="size-4 rounded accent-[#e50914]"
                  />
                  <label htmlFor="isPopularCheck" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Highlight as &ldquo;Most Popular&rdquo; Tier
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-950"
                  >
                    {editingPlan ? "Save Plan Changes" : "Create Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: MANAGE USER SUBSCRIPTION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {managingSubUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#141414] p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 grid place-items-center text-purple-300">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Manage Subscription</h3>
                    <p className="text-xs text-gray-400">{managingSubUser.name} &bull; {managingSubUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setManagingSubUser(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubscription} className="space-y-4">
                {/* Dynamic Plan Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Select Subscription Tier</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {plans.map((p) => {
                      const isSelected = subForm.planId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSubForm({ ...subForm, planId: p.id })}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-950/60 border-purple-500 ring-1 ring-purple-500 shadow-md shadow-purple-950"
                              : "bg-white/[0.04] border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">{p.name}</span>
                            {isSelected && <Sparkles className="size-3.5 text-purple-400" />}
                          </div>
                          <p className="text-xs font-bold text-purple-300">{p.price}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.resolution}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status and Expiry Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Account Status</label>
                    <select
                      value={subForm.status}
                      onChange={(e) => setSubForm({ ...subForm, status: e.target.value as UserSubscriptionDetails["status"] })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="active" className="bg-[#1a1a1a]">Active</option>
                      <option value="past_due" className="bg-[#1a1a1a]">Past Due</option>
                      <option value="canceled" className="bg-[#1a1a1a]">Canceled</option>
                      <option value="trial" className="bg-[#1a1a1a]">Trial Period</option>
                      <option value="unpaid" className="bg-[#1a1a1a]">Unpaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Renewal / Expiry Date</label>
                    <input
                      type="date"
                      value={subForm.expiryDate}
                      onChange={(e) => setSubForm({ ...subForm, expiryDate: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Card Brand & Last 4 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Card Provider</label>
                    <select
                      value={subForm.cardBrand}
                      onChange={(e) => setSubForm({ ...subForm, cardBrand: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none uppercase font-mono"
                    >
                      <option value="visa" className="bg-[#1a1a1a]">VISA</option>
                      <option value="mastercard" className="bg-[#1a1a1a]">Mastercard</option>
                      <option value="amex" className="bg-[#1a1a1a]">Amex</option>
                      <option value="upi" className="bg-[#1a1a1a]">UPI / NetBanking</option>
                      <option value="paypal" className="bg-[#1a1a1a]">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={subForm.cardLast4}
                      onChange={(e) => setSubForm({ ...subForm, cardLast4: e.target.value })}
                      placeholder="4242"
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white font-mono focus:border-[#e50914] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] font-semibold text-gray-400 block mb-2">Quick Grant Actions:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setSubForm({ ...subForm, expiryDate: d.toISOString().split("T")[0], status: "active" });
                      }}
                      className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-gray-300 border border-white/10"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setSubForm({ ...subForm, expiryDate: d.toISOString().split("T")[0], status: "active", planId: "premium" });
                      }}
                      className="px-3 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-800 text-xs text-purple-300 border border-purple-700/50"
                    >
                      +1 Year 4K Ultra
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 3);
                        setSubForm({ ...subForm, expiryDate: d.toISOString().split("T")[0], status: "active", planId: "premium", cardLast4: "VIP" });
                      }}
                      className="px-3 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-800 text-xs text-amber-300 border border-amber-700/50"
                    >
                      👑 3-Yr VIP Pass
                    </button>
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setManagingSubUser(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-950"
                  >
                    Save Subscription
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE PLAN CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-red-900/50 bg-[#161616] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="size-10 rounded-2xl bg-red-500/20 grid place-items-center">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Delete Custom Plan</h3>
                  <p className="text-xs text-gray-400">This will remove this pricing tier from Streamly.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
                <p className="text-white font-bold">{deletingPlan.name}</p>
                <p className="text-purple-400 font-bold">{deletingPlan.price} &bull; {deletingPlan.durationLabel}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlanConfirm}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950"
                >
                  Yes, Delete Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE VIDEO CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-red-900/50 bg-[#161616] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="size-10 rounded-2xl bg-red-500/20 grid place-items-center">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Delete Video</h3>
                  <p className="text-xs text-gray-400">This will remove the title from your catalog.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
                <p className="text-white font-bold">{deletingVideo.title || deletingVideo.name}</p>
                <p className="text-gray-400">ID: {deletingVideo.id} &bull; {deletingVideo.media_type}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingVideo(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVideoConfirm}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950"
                >
                  Yes, Delete Video
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE USER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-red-900/50 bg-[#161616] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="size-10 rounded-2xl bg-red-500/20 grid place-items-center">
                  <UserX className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Permanently Delete User</h3>
                  <p className="text-xs text-gray-400">This account will be erased from Streamly.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
                <p className="text-white font-bold">{deletingUser.name}</p>
                <p className="text-gray-400">{deletingUser.email}</p>
                <p className="text-gray-500 text-[10px]">Plan: {deletingUser.planName}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserConfirm}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 7: ADD USER MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#161616] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <UserPlus className="size-4 text-red-500" />
                  <span>Create New User</span>
                </h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="e.g. Carlos Gomez"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="carlos@example.com"
                    required
                    className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Subscription Plan</label>
                    <select
                      value={newUserForm.planId}
                      onChange={(e) => setNewUserForm({ ...newUserForm, planId: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                          {p.name} ({p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                    <select
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as "active" | "suspended" })}
                      className="w-full rounded-xl bg-white/[0.06] border border-white/10 py-2 px-3 text-xs text-white focus:border-[#e50914] focus:outline-none"
                    >
                      <option value="active" className="bg-[#1a1a1a]">Active</option>
                      <option value="suspended" className="bg-[#1a1a1a]">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#e50914] hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 8: TEST VIDEO STREAM PREVIEW PLAYER MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-black overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 bg-[#141414] border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e50914] text-white">
                    STREAM PREVIEW
                  </span>
                  <h3 className="font-bold text-sm text-white">{previewVideo.title || previewVideo.name}</h3>
                </div>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <video
                  src={
                    previewVideo.videoUrl ||
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  }
                  controls
                  autoPlay
                  className="size-full object-contain"
                />
              </div>

              <div className="p-4 bg-[#141414] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 border-t border-white/10">
                <div className="truncate max-w-md">
                  <span className="text-gray-300 font-semibold">Stream URL:</span>{" "}
                  <code className="text-red-400 text-[11px]">{previewVideo.videoUrl || "Default Mirror"}</code>
                </div>
                <Link
                  to={`/watch?id=${previewVideo.id}&title=${encodeURIComponent(previewVideo.title || previewVideo.name || "")}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
                >
                  <span>Open in Full Player</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
