import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHead } from "@/components/SiteHead";
import { layerInfo, LAYERS } from "@/lib/spiral";
import { RecapCard } from "@/components/RecapCard";
import { CopyButton } from "@/components/CopyButton";
import { downloadNodeAsPng } from "@/lib/share";

export const Route = createFileRoute("/recap/$id")({
  component: SharedRecap,
  head: ({ params }) => ({
    meta: [
      { title: "Connection Recap — Truth Spiral" },
      { name: "description", content: "A spiral, captured." },
      { property: "og:title", content: "We spiraled together." },
      { property: "og:url", content: `/recap/${params.id}` },
    ],
  }),
});

type AnswerRow = {
  id: string;
  card_id: string;
  layer: number;
  player_name: string;
  text: string;
  is_reflection: boolean;
  is_spiral: boolean;
};

function SharedRecap() {
  const { id } = Route.useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      // Try by share_token first, then by raw id
      let s = await supabase.from("sessions").select("id").eq("share_token", id).maybeSingle();
      if (!s.data) {
        s = await supabase.from("sessions").select("id").eq("id", id).maybeSingle();
      }
      if (!s.data) { setNotFound(true); return; }
      setSessionId(s.data.id);
      const { data: a } = await supabase
        .from("answers")
        .select("id, card_id, layer, player_name, text, is_reflection, is_spiral")
        .eq("session_id", s.data.id)
        .order("created_at");
      setAnswers((a ?? []) as AnswerRow[]);
      const cardIds = Array.from(new Set((a ?? []).map((x) => x.card_id)));
      if (cardIds.length) {
        const { data: cs } = await supabase.from("cards").select("id, prompt").in("id", cardIds);
        const map: Record<string, string> = {};
        (cs ?? []).forEach((c) => { map[c.id] = c.prompt; });
        setPrompts(map);
      }
    })();
  }, [id]);

  const stats = useMemo(() => {
    const byLayer = LAYERS.map((l) => answers.filter((a) => a.layer === l.n).length);
    const deepest = Math.max(0, ...answers.map((a) => a.layer));
    const spirals = answers.filter((a) => a.is_spiral).length;
    const score = answers.reduce((s, a) => s + a.layer + (a.is_spiral ? 2 : 0), 0);
    const featured = [...answers]
      .filter((a) => !a.is_reflection && a.text.length > 20)
      .sort((a, b) => b.layer - a.layer || b.text.length - a.text.length)[0];
    const players = Array.from(new Set(answers.map((a) => a.player_name)));
    return { byLayer, deepest, spirals, score, featured, players };
  }, [answers]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Recap not found.</p>
        <Link to="/" className="text-gold">← Home</Link>
      </div>
    );
  }

  if (!sessionId) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const info = layerInfo(stats.deepest || 1);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function exportPng() {
    if (!cardRef.current) return;
    setExporting(true);
    try { await downloadNodeAsPng(cardRef.current, `connection-recap.png`); }
    finally { setExporting(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteHead />

      <div style={{ position: "fixed", left: -10000, top: 0 }}>
        <RecapCard
          ref={cardRef}
          deepest={stats.deepest || 1}
          score={stats.score}
          cards={answers.length}
          spirals={stats.spirals}
          byLayer={stats.byLayer}
          featured={stats.featured ? { text: stats.featured.text, playerName: stats.featured.player_name, prompt: prompts[stats.featured.card_id] ?? "" } : null}
          players={stats.players}
        />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-16">
        <div
          className="rounded-3xl p-8 md:p-10 bg-card/80 backdrop-blur border border-border shadow-card"
          style={{ borderTop: `3px solid ${info.color}` }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Connection Recap</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">
            We reached <span className="italic" style={{ color: info.color }}>{info.name}</span>.
          </h1>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <Stat value={stats.score} label="Depth score" />
            <Stat value={answers.length} label="Cards drawn" />
            <Stat value={stats.spirals} label="Spirals" />
          </div>

          {stats.featured && (
            <blockquote className="mt-10 border-l-2 pl-5 py-2" style={{ borderColor: info.color }}>
              <p className="font-display text-lg italic">"{stats.featured.text}"</p>
              <footer className="text-xs text-muted-foreground mt-2">
                — {stats.featured.player_name}
              </footer>
            </blockquote>
          )}

          <div className="mt-8 text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Players · </span>
            {stats.players.join(" · ")}
          </div>
        </div>

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
