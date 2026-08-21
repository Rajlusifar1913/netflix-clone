import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AppProvider } from "@/components/AppProvider";

const HomePage = lazy(() => import("@/pages/Home"));
const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const ProfilesPage = lazy(() => import("@/pages/Profiles"));
const BrowsePage = lazy(() => import("@/pages/Browse"));
const TVShowsPage = lazy(() => import("@/pages/TVShows"));
const MoviesPage = lazy(() => import("@/pages/Movies"));
const NewPopularPage = lazy(() => import("@/pages/NewPopular"));
const MyListPage = lazy(() => import("@/pages/MyList"));
const WatchPage = lazy(() => import("@/pages/Watch"));
const AccountPage = lazy(() => import("@/pages/Account"));
const SearchPage = lazy(() => import("@/pages/Search"));
const HelpPage = lazy(() => import("@/pages/Help"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLogin"));
import { AdminRouteGuard } from "@/components/AdminRouteGuard";

/**
 * Animated Streamly Logo Startup Splash Screen (Plays on initial app load)
 */
function StartupSplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden select-none"
    >
      {/* Radial Crimson Background Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.45, 0.25, 0.6, 0], scale: [0.4, 1.2, 1.6, 2.2] }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="absolute size-[380px] rounded-full bg-[#e50914] blur-[130px] pointer-events-none"
      />

      {/* Main Animated Streamly Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        animate={{ opacity: 1, scale: [0.8, 1.12, 1], y: 0 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <span className="text-4xl sm:text-6xl font-black tracking-[-0.08em] text-[#e50914] drop-shadow-[0_0_45px_rgba(229,9,20,0.95)]">
          STREAMLY
        </span>

        {/* Shimmer Light Streak */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 2.4, ease: "easeInOut", delay: 0.4 }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] pointer-events-none"
        />

        {/* Pulsing Red Loading Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.6, ease: "easeInOut", delay: 0.3 }}
          className="mt-6 h-1 w-40 sm:w-56 rounded-full bg-gradient-to-r from-transparent via-[#e50914] to-transparent shadow-[0_0_18px_#e50914]"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Animated Streamly Logo Fallback for React Suspense route transitions
 */
function PageLoader() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#141414]">
      <motion.div
        animate={{ scale: [0.95, 1.06, 0.95], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-3"
      >
        <span className="text-3xl font-black tracking-[-0.08em] text-[#e50914] drop-shadow-[0_0_25px_rgba(229,9,20,0.85)]">
          STREAMLY
        </span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse bg-[#e50914] shadow-[0_0_10px_#e50914]" />
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isStartingUp, setIsStartingUp] = useState(true);

  return (
    <BrowserRouter>
      <AppProvider>
        <AnimatePresence mode="wait">
          {isStartingUp && (
            <StartupSplashScreen key="splash" onComplete={() => setIsStartingUp(false)} />
          )}
        </AnimatePresence>

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/tv-shows" element={<TVShowsPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/latest" element={<NewPopularPage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/watch" element={<WatchPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminRouteGuard>
                  <AdminPage />
                </AdminRouteGuard>
              }
            />
            {/* Catch-all → redirect to home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  );
}
