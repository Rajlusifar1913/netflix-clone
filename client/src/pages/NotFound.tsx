import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] text-white px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-[500px] rounded-full bg-[#e50914]/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          {["4","0","4"].map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: "easeOut" }}
              className="text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-[#e50914] drop-shadow-[0_0_60px_rgba(229,9,20,0.6)]"
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#e50914] to-transparent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">Lost in the Stream</h1>
          <p className="max-w-md text-sm sm:text-base text-[#aaa] leading-relaxed">
            This page has gone off-script. The content you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/browse" className="flex items-center gap-2 rounded-full bg-[#e50914] px-7 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(229,9,20,0.4)] transition-all hover:bg-[#c11119] hover:scale-105 active:scale-95">
              <Home className="size-4" />
              Back to Browse
            </Link>
            <Link to="/search" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
              <Search className="size-4" />
              Search Titles
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
