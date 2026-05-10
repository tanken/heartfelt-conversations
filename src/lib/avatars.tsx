import { LAYERS } from "@/lib/spiral";

export const AVATAR_KEYS = [
  "moon", "sun", "comet", "nebula", "star", "eye", "flame", "wave",
] as const;

export type AvatarKey = typeof AVATAR_KEYS[number];

const COLORS: Record<AvatarKey, string> = {
  moon:   "var(--layer-1)",
  sun:    "var(--layer-5)",
  comet:  "var(--layer-2)",
  nebula: "var(--layer-3)",
  star:   "var(--layer-5)",
  eye:    "var(--layer-3)",
  flame:  "var(--layer-4)",
  wave:   "var(--layer-1)",
};

export function avatarColor(key?: string | null): string {
  if (key && key in COLORS) return COLORS[key as AvatarKey];
  // Stable fallback by initial
  return LAYERS[0].color;
}

export function Avatar({
  k,
  name,
  size = 40,
  className = "",
  ring = false,
}: {
  k?: string | null;
  name?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const color = avatarColor(k);
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={"relative inline-flex items-center justify-center rounded-full shrink-0 " + className}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, oklch(0.18 0.04 280))`,
        boxShadow: ring ? `0 0 0 2px ${color}, 0 0 18px ${color}` : "inset 0 0 0 1px oklch(1 0 0 / 0.12)",
        color: "oklch(0.96 0.02 80)",
        fontFamily: "var(--font-display)",
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
      aria-label={name}
    >
      {k ? <Glyph k={k as AvatarKey} size={size * 0.55} /> : initial}
    </div>
  );
}

function Glyph({ k, size }: { k: AvatarKey; size: number }) {
  const s = { width: size, height: size };
  const stroke = "oklch(0.96 0.02 80)";
  switch (k) {
    case "moon":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.6">
          <path d="M16 3a9 9 0 1 0 5 16A7 7 0 0 1 16 3z" fill={stroke} fillOpacity="0.85" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.6">
          <circle cx="12" cy="12" r="4" fill={stroke} />
          {[0,1,2,3,4,5,6,7].map(i => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={12+Math.cos(a)*7} y1={12+Math.sin(a)*7} x2={12+Math.cos(a)*10} y2={12+Math.sin(a)*10} />;
          })}
        </svg>
      );
    case "comet":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.6">
          <circle cx="17" cy="7" r="3" fill={stroke} />
          <path d="M14 10 L4 20" />
          <path d="M16 13 L8 21" opacity="0.6" />
        </svg>
      );
    case "nebula":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.4">
          <ellipse cx="12" cy="12" rx="9" ry="4" />
          <ellipse cx="12" cy="12" rx="4" ry="9" opacity="0.6" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" style={s} fill={stroke} stroke={stroke} strokeWidth="1">
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.6">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" fill={stroke} />
        </svg>
      );
    case "flame":
      return (
        <svg viewBox="0 0 24 24" style={s} fill={stroke} stroke={stroke} strokeWidth="1">
          <path d="M12 2 C 14 6 18 8 18 13 a6 6 0 1 1 -12 0 C 6 9 9 8 10 4 c 1 2 2 3 2 5 z" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 9 q 3 -4 6 0 t 6 0 t 6 0" />
          <path d="M2 15 q 3 -4 6 0 t 6 0 t 6 0" />
        </svg>
      );
  }
}
