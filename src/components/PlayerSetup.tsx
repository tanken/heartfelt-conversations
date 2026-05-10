import { useState } from "react";
import { motion } from "framer-motion";
import { AVATAR_KEYS, Avatar, type AvatarKey } from "@/lib/avatars";
import { saveProfile, type Profile } from "@/lib/profile";

interface Props {
  initial?: Profile | null;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onReady: (p: Profile) => void;
}

export function PlayerSetup({
  initial,
  title = "Step into the spiral",
  subtitle = "Pick a name and a glyph.",
  ctaLabel = "Continue",
  onReady,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState<AvatarKey>(initial?.avatar ?? "moon");

  function submit() {
    const n = name.trim();
    if (!n) return;
    const p: Profile = { name: n, avatar };
    saveProfile(p);
    onReady(p);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto px-6 pt-8 pb-12 text-center"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</div>
      <h1 className="font-display text-3xl mt-2">{title}</h1>

      <div className="mt-8 flex justify-center">
        <Avatar k={avatar} name={name || "?"} size={88} ring />
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 24))}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Your name"
        className="mt-6 w-full bg-card/60 border border-border rounded-full px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-gold/40"
      />

      <div className="mt-6 grid grid-cols-4 gap-3">
        {AVATAR_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setAvatar(k)}
            className="flex items-center justify-center p-2 rounded-2xl transition"
            style={{
              background: avatar === k ? "oklch(1 0 0 / 0.06)" : "transparent",
              outline: avatar === k ? "1px solid var(--gold)" : "1px solid transparent",
            }}
            aria-label={k}
          >
            <Avatar k={k} size={48} />
          </button>
        ))}
      </div>

      <button
        disabled={!name.trim()}
        onClick={submit}
        className="mt-8 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}
