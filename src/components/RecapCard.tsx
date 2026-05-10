import { forwardRef } from "react";
import { LAYERS, layerInfo } from "@/lib/spiral";

interface Props {
  deepest: number;
  score: number;
  cards: number;
  spirals: number;
  byLayer: number[];
  featured?: { text: string; playerName: string; prompt: string } | null;
  players: string[];
}

export const RecapCard = forwardRef<HTMLDivElement, Props>(function RecapCard(
  { deepest, score, cards, spirals, byLayer, featured, players },
  ref,
) {
  const info = layerInfo(deepest);
  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        background: `radial-gradient(ellipse at 50% 0%, ${info.color}, oklch(0.16 0.04 280) 60%, oklch(0.08 0.03 280) 100%)`,
        color: "oklch(0.96 0.02 80)",
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "var(--font-sans)",
        position: "relative",
      }}
    >
      <div>
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>
          Connection Recap
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 84, lineHeight: 1.05, marginTop: 28, letterSpacing: "-0.02em" }}>
          We reached <span style={{ fontStyle: "italic", color: info.color }}>{info.name}</span>.
        </div>

        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <Stat v={score} l="Depth score" />
          <Stat v={cards} l="Cards drawn" />
          <Stat v={spirals} l="Spirals" />
        </div>

        <div style={{ marginTop: 48, display: "flex", alignItems: "flex-end", gap: 16, height: 200 }}>
          {LAYERS.map((l, i) => {
            const v = byLayer[i] ?? 0;
            const max = Math.max(1, ...byLayer);
            return (
              <div key={l.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: "100%", borderRadius: 12, height: `${(v / max) * 100}%`, background: l.color, minHeight: v > 0 ? 12 : 4, opacity: v > 0 ? 1 : 0.25 }} />
                <div style={{ fontSize: 18, opacity: 0.7 }}>{l.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {featured && (
          <div style={{ borderLeft: `3px solid ${info.color}`, paddingLeft: 24 }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, lineHeight: 1.25 }}>
              "{featured.text}"
            </div>
            <div style={{ marginTop: 16, fontSize: 22, opacity: 0.7 }}>
              — {featured.playerName}
            </div>
          </div>
        )}
        <div style={{ marginTop: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, opacity: 0.65 }}>
            {players.slice(0, 6).join(" · ")}
          </div>
          <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>
            truthspiral.app
          </div>
        </div>
      </div>
    </div>
  );
});

function Stat({ v, l }: { v: number | string; l: string }) {
  return (
    <div style={{ background: "oklch(1 0 0 / 0.06)", borderRadius: 24, padding: 24, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 64, color: "var(--gold)" }}>{v}</div>
      <div style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7, marginTop: 4 }}>{l}</div>
    </div>
  );
}
