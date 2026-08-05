import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LockKeyhole, Pencil, Plus, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";

const profileOptions = [
  { name: "Alex",   avatar: "linear-gradient(135deg,#0072d2,#62d5ff)", face: "A" },
  { name: "Morgan", avatar: "linear-gradient(135deg,#6d28d9,#d946ef)", face: "M" },
  { name: "Kids",   avatar: "linear-gradient(135deg,#f59e0b,#ef4444)", face: "★", kids: true },
  { name: "Guest",  avatar: "linear-gradient(135deg,#059669,#84cc16)", face: "G" },
];

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { setProfile } = useApp();
  const [leaving, setLeaving] = useState<string | null>(null);

  function select(profile: (typeof profileOptions)[number]) {
    setLeaving(profile.name);
    setProfile({ name: profile.name, avatar: profile.avatar, kids: profile.kids });
    window.setTimeout(() => navigate("/browse"), 350);
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#141414]">
      <header className="flex items-center justify-between px-6 py-5 sm:px-12">
        <Logo href="/browse" />
        <span className="flex items-center gap-2 text-xs text-[#888]">
          <ShieldCheck className="size-4" /> Secure profiles
        </span>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: leaving ? 0 : 1, y: leaving ? -12 : 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-1 flex-col items-center justify-center px-6 pb-24"
      >
        <h1 className="text-center text-3xl font-medium tracking-tight sm:text-5xl">
          Who&apos;s watching?
        </h1>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:mt-12 sm:grid-cols-4 sm:gap-8">
          {profileOptions.map((profile) => (
            <button
              key={profile.name}
              onClick={() => select(profile)}
              className="group w-28 sm:w-36"
              aria-label={`Continue as ${profile.name}`}
            >
              <div
                style={{ background: profile.avatar }}
                className="relative grid aspect-square place-items-center overflow-hidden rounded-md border-2 border-transparent shadow-lg transition-all duration-200 group-hover:scale-[1.04] group-hover:border-white"
              >
                <span className="select-none text-5xl font-black text-white/90 drop-shadow-md sm:text-6xl">
                  {profile.face}
                </span>
                {profile.kids && (
                  <LockKeyhole className="absolute right-2 top-2 size-4 text-white/80" />
                )}
              </div>
              <span className="mt-3 block text-base text-[#999] group-hover:text-white sm:text-lg">
                {profile.name}
              </span>
            </button>
          ))}
        </div>

        <button className="mt-14 flex items-center gap-2 border border-[#777] px-5 py-2 text-sm uppercase tracking-[.18em] text-[#999] hover:border-white hover:text-white">
          <Pencil className="size-4" /> Manage profiles
        </button>
        <button className="mt-5 flex items-center gap-2 text-sm text-[#777] hover:text-white">
          <Plus className="size-4" /> Add profile
        </button>
      </motion.section>

      {leaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black"
        >
          <p className="text-xl font-semibold">Loading {leaving}&apos;s Streamly…</p>
        </motion.div>
      )}
    </main>
  );
}
