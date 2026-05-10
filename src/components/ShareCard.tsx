import { forwardRef } from "react";
import { layerInfo } from "@/lib/spiral";
import { Avatar } from "@/lib/avatars";

interface Props {
  layer: number;
  prompt: string;
  text: string;
  playerName: string;
  avatarKey?: string | null;
  variant?: "card" | "story";
}

/** Shareable answer card. Sized for download (1080×1350 story by default). */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { layer, prompt, text, playerName, avatarKey, variant = "story" },
  ref,
) {
  const info = layerInfo(layer);
  const w = variant === "story" ? 1080 : 1080;
  const h = variant === "story" ? 1350 : 1080;
  return (
    <div
      ref={ref}
      style={{
        width: w,
        height: h,
        background: `radial-gradient(ellipse at 30% 0%, ${info.color}, oklch(0.16 0.04 280) 65%, oklch(0.08 0.03 280) 100%)`,
        color: "oklch(0.96 0.02 80)",
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "var(--font-sans)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>
          Layer 0{layer} · {info.name}
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 64,
          lineHeight: 1.1,
          marginTop: 28,
          letterSpacing: "-0.02em",
        }}>
          {prompt}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 48,
          lineHeight: 1.25,
          opacity: 0.95,
        }}>
          "{text}"
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar k={avatarKey} name={playerName} size={72} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{playerName}</div>
            <div style={{ fontSize: 20, opacity: 0.6, letterSpacing: 4, textTransform: "uppercase" }}>
              truthspiral.app
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
