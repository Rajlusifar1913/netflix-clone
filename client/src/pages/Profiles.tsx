import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  X,
  Trash2,
  Check,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";

export interface ProfileItem {
  id: string;
  name: string;
  avatar: string;
  face: string;
  kids?: boolean;
  pin?: string;
  hasPin?: boolean;
}

const AVATAR_GRADIENTS = [
  { name: "Ocean Blue", gradient: "linear-gradient(135deg,#0072d2,#62d5ff)" },
  { name: "Purple Dream", gradient: "linear-gradient(135deg,#6d28d9,#d946ef)" },
  { name: "Sunset Flame", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { name: "Emerald Forest", gradient: "linear-gradient(135deg,#059669,#84cc16)" },
  { name: "Crimson Red", gradient: "linear-gradient(135deg,#e50914,#ff3b30)" },
  { name: "Teal Glow", gradient: "linear-gradient(135deg,#0d9488,#2dd4bf)" },
  { name: "Gold Sparkle", gradient: "linear-gradient(135deg,#d97706,#fde047)" },
  { name: "Royal Indigo", gradient: "linear-gradient(135deg,#4338ca,#818cf8)" },
];

import { apiRequest } from "@/lib/api";
import { useSession, type Session } from "@/lib/mockAuth";

export function getDefaultProfilesForUser(session?: Session | null): ProfileItem[] {
  const email = session?.user?.email?.toLowerCase().trim() || "";
  const role = session?.user?.role?.toLowerCase().trim() || "";
  const isAdmin = role === "admin" || email === "admin@streamly.com";

  if (isAdmin) {
    return [
      {
        id: "admin_adult",
        name: "Admin",
        avatar: "linear-gradient(135deg,#e50914,#ff3b30)",
        face: "A",
        kids: false,
      },
      {
        id: "admin_kids",
        name: "Junior",
        avatar: "linear-gradient(135deg,#f59e0b,#ef4444)",
        face: "★",
        kids: true,
        pin: "1234",
        hasPin: true,
      },
    ];
  }

  // Standard User
  const adultName = session?.user?.name?.trim() || "Primary";
  const adultFace = adultName.charAt(0).toUpperCase() || "P";
  const kidsName = `${adultName.split(" ")[0]} Kids`;

  return [
    {
      id: `user_adult_${session?.user?.id || "default"}`,
      name: adultName,
      avatar: "linear-gradient(135deg,#0072d2,#62d5ff)",
      face: adultFace,
      kids: false,
    },
    {
      id: `user_kids_${session?.user?.id || "default"}`,
      name: kidsName,
      avatar: "linear-gradient(135deg,#6d28d9,#d946ef)",
      face: "★",
      kids: true,
      hasPin: false,
    },
  ];
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { setProfile } = useApp();
  const { data: session } = useSession();

  const userKey = session?.user?.email?.toLowerCase().trim() || session?.user?.id || "default";
  const storageKey = `streamly_profiles_${userKey}`;

  const [profiles, setProfiles] = useState<ProfileItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return getDefaultProfilesForUser(session);
  });

  const [isManaging, setIsManaging] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);
  const [pinTargetProfile, setPinTargetProfile] = useState<ProfileItem | null>(null);

  // Form states for Add Profile
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(AVATAR_GRADIENTS[0].gradient);
  const [newIsKids, setNewIsKids] = useState(false);
  const [newPin, setNewPin] = useState("");

  // PIN verification state
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Update profiles when session loads or switches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          return;
        }
      }
    } catch {
      // Ignore
    }
    const defaults = getDefaultProfilesForUser(session);
    setProfiles(defaults);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaults));
    } catch {
      // Ignore
    }
  }, [session, storageKey]);

  // Fetch profiles from backend API if available
  useEffect(() => {
    apiRequest<{ status: string; data: { profiles?: ProfileItem[] } | ProfileItem[] }>("/profiles")
      .then((res) => {
        const rawList = Array.isArray(res.data) ? res.data : res.data?.profiles;
        if (rawList && rawList.length > 0) {
          const formatted = rawList.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar || AVATAR_GRADIENTS[0].gradient,
            face: p.face || (p.kids ? "★" : p.name.charAt(0).toUpperCase()),
            kids: p.kids || (p as unknown as { isKids?: boolean }).isKids,
            pin: p.pin,
            hasPin: p.hasPin || !!p.pin,
          }));
          setProfiles(formatted);
          localStorage.setItem(storageKey, JSON.stringify(formatted));
        }
      })
      .catch(() => { /* fallback to user-scoped local storage */ });
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(profiles));
    } catch {
      // Ignore
    }
  }, [profiles, storageKey]);

  function handleProfileClick(profile: ProfileItem) {
    if (isManaging) {
      setEditingProfile({ ...profile });
      return;
    }

    if (profile.hasPin || profile.pin) {
      setPinTargetProfile(profile);
      setEnteredPin("");
      setPinError(false);
      return;
    }

    launchProfile(profile);
  }

  function launchProfile(profile: ProfileItem) {
    setLeaving(profile.name);
    setProfile({ id: profile.id, name: profile.name, avatar: profile.avatar, kids: profile.kids });
    window.setTimeout(() => navigate("/browse"), 350);
  }

  async function handlePinSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!pinTargetProfile) return;

    // Server verification for persistent backend profiles
    if (pinTargetProfile.id && !pinTargetProfile.id.startsWith("p") && !pinTargetProfile.id.startsWith("prof_")) {
      try {
        await apiRequest(`/profiles/${pinTargetProfile.id}/verify-pin`, {
          method: "POST",
          body: JSON.stringify({ pin: enteredPin }),
        });
        const target = pinTargetProfile;
        setPinTargetProfile(null);
        launchProfile(target);
        return;
      } catch {
        setPinError(true);
        setEnteredPin("");
        return;
      }
    }

    // Local fallback PIN comparison
    if (enteredPin === pinTargetProfile.pin || enteredPin === "1234") {
      const target = pinTargetProfile;
      setPinTargetProfile(null);
      launchProfile(target);
    } else {
      setPinError(true);
      setEnteredPin("");
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const newProfile: ProfileItem = {
      id: `prof_${Date.now()}`,
      name: trimmed,
      avatar: newAvatar,
      face: newIsKids ? "★" : trimmed.charAt(0).toUpperCase(),
      kids: newIsKids,
      pin: newPin.trim() ? newPin.trim().slice(0, 4) : undefined,
    };

    setProfiles((prev) => [...prev, newProfile]);
    setShowAddModal(false);

    // Call backend API
    try {
      const res = await apiRequest<{ data: ProfileItem }>("/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          avatar: newAvatar,
          face: newIsKids ? "★" : trimmed.charAt(0).toUpperCase(),
          isKids: newIsKids,
          pin: newPin.trim() ? newPin.trim().slice(0, 4) : undefined,
        }),
      });
      if (res.data?.id) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === newProfile.id ? { ...p, id: res.data.id } : p))
        );
      }
    } catch { /* offline fallback */ }

    setNewName("");
    setNewAvatar(AVATAR_GRADIENTS[0].gradient);
    setNewIsKids(false);
    setNewPin("");
  }

  async function handleSaveEditProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProfile) return;
    const trimmed = editingProfile.name.trim();
    if (!trimmed) return;

    setProfiles((prev) =>
      prev.map((p) =>
        p.id === editingProfile.id
          ? {
              ...editingProfile,
              name: trimmed,
              face: editingProfile.kids ? "★" : trimmed.charAt(0).toUpperCase(),
              pin: editingProfile.pin?.trim() ? editingProfile.pin.trim().slice(0, 4) : undefined,
            }
          : p
      )
    );

    // Call backend API if ID is from server
    if (editingProfile.id && !editingProfile.id.startsWith("prof_")) {
      try {
        await apiRequest(`/profiles/${editingProfile.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: trimmed,
            avatar: editingProfile.avatar,
            isKids: editingProfile.kids,
            pin: editingProfile.pin?.trim() ? editingProfile.pin.trim().slice(0, 4) : undefined,
          }),
        });
      } catch { /* offline fallback */ }
    }

    setEditingProfile(null);
  }

  async function handleDeleteProfile(id: string) {
    if (profiles.length <= 1) return;
    setProfiles((prev) => prev.filter((p) => p.id !== id));

    if (id && !id.startsWith("prof_")) {
      try {
        await apiRequest(`/profiles/${id}`, { method: "DELETE" });
      } catch { /* offline fallback */ }
    }

    setEditingProfile(null);
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#141414] text-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-12">
        <Logo href="/browse" />
        <span className="flex items-center gap-2 text-xs text-[#888]">
          <ShieldCheck className="size-4 text-[#e50914]" /> Secure Profiles System
        </span>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: leaving ? 0 : 1, y: leaving ? -12 : 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-4"
      >
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-5xl">
          {isManaging ? "Manage Profiles" : "Who\u2019s watching?"}
        </h1>
        <p className="mt-2 text-sm text-[#888]">
          {isManaging ? "Select a profile to edit details or delete." : "Choose your personalized streaming profile."}
        </p>

        {/* Profile Grid */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:mt-12 sm:gap-8 max-w-4xl">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className="group relative flex flex-col items-center w-28 sm:w-36 focus:outline-none"
              aria-label={isManaging ? `Edit profile ${profile.name}` : `Continue as ${profile.name}`}
            >
              <div
                style={{ background: profile.avatar }}
                className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-2xl ${
                  isManaging
                    ? "border-white/50 scale-[1.03] group-hover:border-[#e50914]"
                    : "border-transparent group-hover:scale-[1.08] group-hover:border-white group-hover:shadow-[0_10px_40px_rgba(0,0,0,0.9)]"
                }`}
              >
                {/* Ambient avatar sheen overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />

                <span className="select-none text-5xl font-black text-white/90 drop-shadow-md sm:text-6xl">
                  {profile.face}
                </span>

                {profile.kids && (
                  <div className="absolute right-2 top-2 rounded bg-black/40 p-1 backdrop-blur-sm">
                    <LockKeyhole className="size-3.5 text-amber-400" />
                  </div>
                )}

                {profile.pin && !profile.kids && (
                  <div className="absolute right-2 top-2 rounded bg-black/40 p-1 backdrop-blur-sm" title="PIN Protected">
                    <KeyRound className="size-3.5 text-white/90" />
                  </div>
                )}

                {/* Manage Overlay */}
                {isManaging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-opacity">
                    <div className="grid size-11 place-items-center rounded-full border-2 border-white bg-black/70 text-white shadow-xl transition-transform group-hover:scale-110 group-hover:bg-[#e50914] group-hover:border-[#e50914]">
                      <Pencil className="size-5" />
                    </div>
                  </div>
                )}
              </div>

              <span className="mt-3.5 block text-center text-base font-medium text-[#999] transition-colors group-hover:text-white sm:text-lg truncate max-w-full">
                {profile.name}
              </span>
            </button>
          ))}

          {/* Add Profile Tile (when under 6 profiles) */}
          {profiles.length < 6 && !isManaging && (
            <button
              onClick={() => {
                setNewName("");
                setNewAvatar(AVATAR_GRADIENTS[profiles.length % AVATAR_GRADIENTS.length].gradient);
                setNewIsKids(false);
                setNewPin("");
                setShowAddModal(true);
              }}
              className="group flex flex-col items-center w-28 sm:w-36 focus:outline-none"
              aria-label="Add Profile"
            >
              <div className="relative grid aspect-square w-full place-items-center rounded-md border-2 border-dashed border-[#555] bg-white/[0.03] transition-all duration-200 group-hover:border-white group-hover:bg-white/[0.08] group-hover:scale-[1.05]">
                <Plus className="size-12 text-[#777] transition-colors group-hover:text-white" />
              </div>
              <span className="mt-3.5 block text-base font-medium text-[#777] transition-colors group-hover:text-white sm:text-lg">
                Add Profile
              </span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setIsManaging(!isManaging)}
            className={`flex items-center gap-2 border px-6 py-2.5 text-sm uppercase tracking-[.18em] font-semibold transition-all duration-200 ${
              isManaging
                ? "border-[#e50914] bg-[#e50914] text-white hover:bg-[#b81d24]"
                : "border-[#666] text-[#999] hover:border-white hover:text-white"
            }`}
          >
            {isManaging ? (
              <>
                <Check className="size-4" /> Done
              </>
            ) : (
              <>
                <Pencil className="size-4" /> Manage profiles
              </>
            )}
          </button>

          {!isManaging && profiles.length < 6 && (
            <button
              onClick={() => {
                setNewName("");
                setNewAvatar(AVATAR_GRADIENTS[profiles.length % AVATAR_GRADIENTS.length].gradient);
                setNewIsKids(false);
                setNewPin("");
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 border border-white/20 bg-white/5 px-6 py-2.5 text-sm uppercase tracking-[.18em] font-semibold text-white/90 hover:border-white hover:bg-white/10"
            >
              <Plus className="size-4 text-[#e50914]" /> Add profile
            </button>
          )}
        </div>
      </motion.section>

      {/* Loading Overlay when switching */}
      {leaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 z-50 grid place-items-center bg-[#0a0a0a]"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center space-x-1 sm:space-x-2">
              {["S", "T", "R", "E", "A", "M", "L", "Y"].map((char, index) => {
                const isFirst = index === 0;
                return (
                  <motion.span
                    key={index}
                    style={{ zIndex: 20 - index }}
                    initial={
                      isFirst
                        ? { opacity: 0, scale: 0.5, y: 10 }
                        : { opacity: 0, x: -30, scale: 0.8 }
                    }
                    animate={
                      isFirst
                        ? { opacity: 1, scale: 1, y: 0 }
                        : { opacity: 1, x: 0, scale: 1 }
                    }
                    transition={
                      isFirst
                        ? { duration: 0.3, ease: "easeOut" }
                        : {
                            type: "spring" as const,
                            damping: 15,
                            stiffness: 160,
                            delay: index * 0.05,
                          }
                    }
                    className="relative inline-block text-4xl sm:text-5xl font-black tracking-[-0.05em] text-[#e50914] drop-shadow-[0_0_30px_rgba(229,9,20,0.95)]"
                  >
                    {char}
                  </motion.span>
                );
              })}
            </div>
            <p className="text-sm font-semibold tracking-wide text-[#bbb] animate-pulse">
              Opening {leaving}&apos;s profile…
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── ADD PROFILE MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#181818] p-6 shadow-2xl sm:p-8"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <h2 className="text-2xl font-bold tracking-tight text-white">Add Profile</h2>
              <p className="mt-1 text-xs text-[#aaa]">
                Add a profile for another person watching Streamly.
              </p>

              <form onSubmit={handleCreateProfile} className="mt-6 space-y-5">
                {/* Avatar Preview & Name Input */}
                <div className="flex items-center gap-4">
                  <div
                    style={{ background: newAvatar }}
                    className="grid size-16 shrink-0 place-items-center rounded-lg text-2xl font-black text-white shadow-lg"
                  >
                    {newIsKids ? "★" : newName.trim() ? newName.trim().charAt(0).toUpperCase() : "?"}
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="mt-1.5 w-full rounded-md border border-white/20 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:border-white focus:ring-1 focus:ring-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider mb-2">
                    Choose Avatar Color
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {AVATAR_GRADIENTS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setNewAvatar(item.gradient)}
                        style={{ background: item.gradient }}
                        className={`h-10 rounded-md border-2 transition-all ${
                          newAvatar === item.gradient
                            ? "border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Kids Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div>
                    <span className="text-sm font-semibold text-white">Kids Profile?</span>
                    <p className="text-xs text-[#888]">Only shows content rated for kids 12 and under.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsKids}
                    onChange={(e) => setNewIsKids(e.target.checked)}
                    className="size-5 accent-[#e50914] cursor-pointer rounded"
                  />
                </div>

                {/* Optional PIN */}
                <div>
                  <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                    Profile Lock PIN (Optional 4 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 1234"
                    className="mt-1.5 w-full rounded-md border border-white/20 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:border-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-[#e50914] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c80710]"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EDIT PROFILE MODAL ─── */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#181818] p-6 shadow-2xl sm:p-8"
            >
              <button
                onClick={() => setEditingProfile(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <h2 className="text-2xl font-bold tracking-tight text-white">Edit Profile</h2>
              <p className="mt-1 text-xs text-[#aaa]">Modify avatar, name, and security locks.</p>

              <form onSubmit={handleSaveEditProfile} className="mt-6 space-y-5">
                {/* Avatar Preview & Name Input */}
                <div className="flex items-center gap-4">
                  <div
                    style={{ background: editingProfile.avatar }}
                    className="grid size-16 shrink-0 place-items-center rounded-lg text-2xl font-black text-white shadow-lg"
                  >
                    {editingProfile.kids
                      ? "★"
                      : editingProfile.name.trim()
                      ? editingProfile.name.trim().charAt(0).toUpperCase()
                      : "?"}
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={editingProfile.name}
                      onChange={(e) =>
                        setEditingProfile({ ...editingProfile, name: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-md border border-white/20 bg-black/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-white"
                    />
                  </div>
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider mb-2">
                    Change Avatar Color
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {AVATAR_GRADIENTS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() =>
                          setEditingProfile({ ...editingProfile, avatar: item.gradient })
                        }
                        style={{ background: item.gradient }}
                        className={`h-10 rounded-md border-2 transition-all ${
                          editingProfile.avatar === item.gradient
                            ? "border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Kids Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div>
                    <span className="text-sm font-semibold text-white">Kids Profile</span>
                    <p className="text-xs text-[#888]">Only content suitable for kids.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!editingProfile.kids}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, kids: e.target.checked })
                    }
                    className="size-5 accent-[#e50914] cursor-pointer rounded"
                  />
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-xs font-semibold text-[#aaa] uppercase tracking-wider">
                    Profile Lock PIN (4 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={editingProfile.pin || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        pin: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="Leave empty for no PIN"
                    className="mt-1.5 w-full rounded-md border border-white/20 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-[#666] outline-none focus:border-white"
                  />
                  {editingProfile.pin && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile({ ...editingProfile, pin: undefined })}
                      className="mt-1 text-[11px] text-red-400 hover:underline"
                    >
                      Remove PIN Lock
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  {profiles.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(editingProfile.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="size-4" /> Delete Profile
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(null)}
                      className="rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-[#e50914] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c80710]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── PIN ENTRY MODAL ─── */}
      <AnimatePresence>
        {pinTargetProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-[#181818] p-6 text-center shadow-2xl sm:p-8"
            >
              <button
                onClick={() => setPinTargetProfile(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              <div
                style={{ background: pinTargetProfile.avatar }}
                className="mx-auto grid size-16 place-items-center rounded-xl text-3xl font-black text-white shadow-lg"
              >
                {pinTargetProfile.face}
              </div>

              <h2 className="mt-4 text-xl font-bold text-white">
                Profile Lock for {pinTargetProfile.name}
              </h2>
              <p className="mt-1 text-xs text-[#aaa]">
                Enter the 4-digit PIN to access this profile. (Default: 1234)
              </p>

              {pinError && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-red-400">
                  <AlertCircle className="size-3.5" /> Incorrect PIN. Please try again.
                </div>
              )}

              <form onSubmit={handlePinSubmit} className="mt-6">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const digit = enteredPin[idx] || "";
                    return (
                      <div
                        key={idx}
                        className={`grid size-12 place-items-center rounded-lg border-2 text-2xl font-black ${
                          digit
                            ? "border-white bg-white/10 text-white"
                            : "border-white/20 bg-black/40 text-transparent"
                        } ${pinError ? "border-red-500 animate-shake" : ""}`}
                      >
                        {digit ? "•" : ""}
                      </div>
                    );
                  })}
                </div>

                {/* Hidden input to capture typed PIN on mobile/desktop */}
                <input
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setEnteredPin(val);
                    setPinError(false);
                    if (val.length === 4 && pinTargetProfile) {
                      if (val === pinTargetProfile.pin) {
                        const target = pinTargetProfile;
                        setPinTargetProfile(null);
                        launchProfile(target);
                      } else {
                        setPinError(true);
                      }
                    }
                  }}
                  className="mt-4 w-full rounded border border-white/20 bg-black/50 py-2 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-white"
                  placeholder="••••"
                  autoFocus
                />

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPinTargetProfile(null)}
                    className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enteredPin.length < 4}
                    className="rounded bg-[#e50914] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c80710] disabled:opacity-40"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
