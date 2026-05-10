import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SiteHead } from "@/components/SiteHead";
import { layerInfo, LAYERS } from "@/lib/spiral";
import type { GameAnswer } from "@/components/CardStage";
import { RecapCard } from "@/components/RecapCard";
import { CopyButton } from "@/components/CopyButton";
import { downloadNodeAsPng } from "@/lib/share";

export const Route = createFileRoute("/recap/local")({
  component: Recap,
  head: () => ({
    meta: [
      { title: "Connection Recap — Truth Spiral" },
      { name: "description", content: "Your spiral, captured." },
    ],
  }),
});

type Stored = {
  mode: string;
  players: string[];
  answers: GameAnswer[];
  ts: number;
};

function Recap() {
  const [data, setData] = useState<Stored | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("ts:lastRecap");
    if (raw) setData(JSON.parse(raw));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const byLayer = LAYERS.map((l) => data.answers.filter((a) => a.layer === l.n).length);
    const deepest = Math.max(0, ...data.answers.map((a) => a.layer));
    const spirals = data.answers.filter((a) => a.action === "spiral").length;
    const honest = data.answers.filter((a) => a.action !== "reflect").length;
    const score = data.answers.reduce((s, a) => s + a.layer + (a.action === "spiral" ? 2 : 0), 0);
    const featured = [...data.answers]
      .filter((a) => a.action !== "reflect" && a.text.length > 20)
      .sort((a, b) => b.layer - a.layer || b.text.length - a.text.length)[0];
    return { byLayer, deepest, spirals, honest, score, featured };
  }, [data]);

  if (!data || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No recent session found.</p>
          <Link to="/" className="mt-4 inline-block text-gold">Return home →</Link>
        </div>
      </div>
    );
  }

  const info = layerInfo(stats.deepest);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function exportPng() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await downloadNodeAsPng(cardRef.current, `connection-recap.png`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHead />

      {/* Hidden full-resolution recap card for export */}
      <div style={{ position: "fixed", left: -10000, top: 0 }}>
        <RecapCard
          ref={cardRef}
          deepest={stats.deepest}
          score={stats.score}
          cards={data.answers.length}
          spirals={stats.spirals}
          byLayer={stats.byLayer}
          featured={stats.featured ? { text: stats.featured.text, playerName: stats.featured.playerName, prompt: stats.featured.prompt } : null}
          players={data.players}
        />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-8 md:p-10 bg-card/80 backdrop-blur border border-border shadow-card"
          style={{ borderTop: `3px solid ${info.color}` }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Connection Recap</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">
            You reached <span className="italic" style={{ color: info.color }}>{info.name}</span>.
          </h1>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <Stat value={stats.score} label="Depth score" />
            <Stat value={data.answers.length} label="Cards drawn" />
            <Stat value={stats.spirals} label="Spirals" />
          </div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Per layer</div>
            <div className="flex items-end gap-2 h-32">
              {LAYERS.map((l, i) => {
                const v = stats.byLayer[i];
                const max = Math.max(1, ...stats.byLayer);
                return (
                  <div key={l.n} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg" style={{
                      height: `${(v / max) * 100}%`,
                      background: l.color,
                      minHeight: v > 0 ? 6 : 2,
                      opacity: v > 0 ? 1 : 0.2,
                    }} />
                    <div className="text-[10px] text-muted-foreground">{l.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {stats.featured && (
            <blockquote className="mt-10 border-l-2 pl-5 py-2" style={{ borderColor: info.color }}>
              <p className="font-display text-lg italic">"{stats.featured.text}"</p>
              <footer className="text-xs text-muted-foreground mt-2">
                — {stats.featured.playerName}, on "{stats.featured.prompt}"
              </footer>
            </blockquote>
          )}

          {data.players.length > 1 && (
            <div className="mt-8 text-xs text-muted-foreground">
              <span className="uppercase tracking-widest">Players · </span>
              {data.players.join(" · ")}
            </div>
          )}
        </motion.div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={exportPng}
            disabled={exporting}
            className="px-5 py-2.5 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
          >
            {exporting ? "Rendering…" : "Export recap image"}
          </button>
          <CopyButton value={url} className="px-5 py-2.5 rounded-full border border-border hover:bg-secondary/60">
            Copy recap link
          </CopyButton>
          <Link to="/play/local" className="px-5 py-2.5 rounded-full border border-border hover:bg-secondary/60">
            Play again
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4 text-center">
      <div className="font-display text-3xl text-gold">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
