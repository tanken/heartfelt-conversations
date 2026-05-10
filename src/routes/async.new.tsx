import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHead } from "@/components/SiteHead";
import { PlayerSetup } from "@/components/PlayerSetup";
import { loadProfile, type Profile } from "@/lib/profile";
import { loadCoreCards, loadCoreDeckId } from "@/lib/cards";
import { LAYERS, layerInfo } from "@/lib/spiral";
import type { GameCard } from "@/components/CardStage";
import { makeToken } from "@/lib/share";

export const Route = createFileRoute("/async/new")({
  component: AsyncNew,
  head: () => ({
    meta: [
      { title: "Send an async card — Truth Spiral" },
      { name: "description", content: "Pick a card, write your answer, send the link." },
    ],
  }),
});

function AsyncNew() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [layer, setLayer] = useState<number>(1);
  const [card, setCard] = useState<GameCard | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    loadCoreCards().then(setCards);
  }, []);

  useEffect(() => {
    if (!cards.length) return;
    const pool = cards.filter((c) => c.layer === layer);
    setCard(pool[Math.floor(Math.random() * pool.length)] ?? null);
  }, [layer, cards]);

  if (!profile) {
    return (
      <div className="min-h-screen">
        <SiteHead />
        <PlayerSetup
          subtitle="Async play"
          title="Send a card to someone"
          onReady={setProfile}
        />
      </div>
    );
  }

  async function send() {
    if (!card || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const deckId = await loadCoreDeckId();
      if (!deckId) return;
      const token = makeToken();
      const { data: session } = await supabase
        .from("sessions")
        .insert({
          deck_id: deckId,
          mode: "async",
          status: "active",
          share_token: token,
          host_name: profile!.name,
          current_layer: card.layer,
        })
        .select("id, share_token")
        .single();
      if (!session) return;

      await supabase.from("answers").insert({
        session_id: session.id,
        card_id: card.id,
        player_name: profile!.name,
        avatar_key: profile!.avatar,
        layer: card.layer,
        text: text.trim(),
      });

      navigate({ to: "/async/$id", params: { id: session.share_token! } });
    } finally {
      setSubmitting(false);
    }
  }

  if (!card) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading the deck…</div>;
  }

  const info = layerInfo(layer);

  return (
    <div className="min-h-screen">
      <SiteHead />
      <main className="max-w-2xl mx-auto px-6 pb-16">
        <div className="text-center mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Async · pick a layer</div>

        <div className="flex justify-center gap-2 mb-6">
          {LAYERS.map((l) => (
            <button
              key={l.n}
              onClick={() => setLayer(l.n)}
              className="px-3 py-1.5 rounded-full text-xs uppercase tracking-widest transition"
              style={{
                background: layer === l.n ? l.color : "transparent",
                color: layer === l.n ? "oklch(0.16 0.04 280)" : "var(--muted-foreground)",
                border: `1px solid ${layer === l.n ? l.color : "var(--border)"}`,
              }}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 bg-card/80 backdrop-blur shadow-card border border-border"
          style={{ borderTop: `3px solid ${info.color}` }}
        >
          <p className="font-display text-2xl md:text-3xl text-center text-balance min-h-[5rem] flex items-center justify-center">
            {card.prompt}
          </p>
          <button
            onClick={() => {
              const pool = cards.filter((c) => c.layer === layer && c.id !== card.id);
              setCard(pool[Math.floor(Math.random() * pool.length)] ?? card);
            }}
            className="mt-2 mx-auto block text-xs uppercase tracking-widest text-muted-foreground hover:text-cream"
          >
            ↻ Draw another
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Write your answer first. They'll see it only after they reply."
          className="mt-6 w-full bg-card/60 border border-border rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />

        <button
          disabled={!text.trim() || submitting}
          onClick={send}
          className="mt-4 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
        >
          {submitting ? "Sealing the card…" : "Seal & get share link"}
        </button>
      </main>
    </div>
  );
}
