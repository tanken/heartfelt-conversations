import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHead } from "@/components/SiteHead";
import { PlayerSetup } from "@/components/PlayerSetup";
import { CopyButton } from "@/components/CopyButton";
import { loadProfile, type Profile } from "@/lib/profile";
import { layerInfo } from "@/lib/spiral";
import { loadCoreCards } from "@/lib/cards";
import type { GameCard } from "@/components/CardStage";
import { Avatar } from "@/lib/avatars";

export const Route = createFileRoute("/async/$id")({
  component: AsyncThread,
  head: ({ params }) => ({
    meta: [
      { title: "An async spiral — Truth Spiral" },
      { name: "description", content: "Someone sent you a card. Reply to unlock." },
      { property: "og:title", content: "You've been sent a Truth Spiral card" },
      { property: "og:description", content: "Write your answer to unlock theirs." },
      { property: "og:url", content: `/async/${params.id}` },
    ],
  }),
});

type AnswerRow = {
  id: string;
  card_id: string;
  player_name: string;
  avatar_key: string | null;
  layer: number;
  text: string;
  created_at: string;
};
type Sess = { id: string; host_name: string | null; share_token: string };

function AsyncThread() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Sess | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [text, setText] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    loadCoreCards().then(setCards);
  }, []);

  async function refresh() {
    const { data: s } = await supabase
      .from("sessions")
      .select("id, host_name, share_token")
      .eq("share_token", id)
      .maybeSingle();
    if (!s) {
      setNotFound(true);
      return;
    }
    setSession(s as Sess);
    const { data: a } = await supabase
      .from("answers")
      .select("id, card_id, player_name, avatar_key, layer, text, created_at")
      .eq("session_id", s.id)
      .order("created_at");
    setAnswers((a ?? []) as AnswerRow[]);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  // Realtime
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`async:${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers", filter: `session_id=eq.${session.id}` }, (p) => {
        setAnswers((prev) => [...prev, p.new as AnswerRow]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session?.id]);

  // Pair the latest unanswered card → user must reply
  const pendingCard = useMemo(() => {
    if (!answers.length || !cards.length || !profile) return null;
    const last = answers[answers.length - 1];
    if (last.player_name === profile.name) return null; // your own; you wait
    const card = cards.find((c) => c.id === last.card_id);
    return card ? { card, from: last } : null;
  }, [answers, cards, profile]);

  const youJustReplied = useMemo(() => {
    if (!profile || answers.length < 2) return false;
    const last = answers[answers.length - 1];
    return last.player_name === profile.name;
  }, [answers, profile]);

  async function reply() {
    if (!session || !pendingCard || !profile || !text.trim() || busy) return;
    setBusy(true);
    try {
      await supabase.from("answers").insert({
        session_id: session.id,
        card_id: pendingCard.card.id,
        player_name: profile.name,
        avatar_key: profile.avatar,
        layer: pendingCard.card.layer,
        text: text.trim(),
      });
      setText("");
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function spiralOn() {
    if (!session || !profile || !cards.length) return;
    // Send a new card from the next layer
    const lastLayer = answers[answers.length - 1]?.layer ?? 1;
    const nextLayer = Math.min(5, lastLayer + 1);
    const pool = cards.filter((c) => c.layer === nextLayer);
    const card = pool[Math.floor(Math.random() * pool.length)];
    if (!card) return;
    await supabase.from("answers").insert({
      session_id: session.id,
      card_id: card.id,
      player_name: profile.name,
      avatar_key: profile.avatar,
      layer: card.layer,
      text: "(awaiting their reply)",
      is_reflection: true,
    });
    refresh();
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">This async spiral wasn't found.</p>
        <Link to="/" className="text-gold">← Home</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <SiteHead />
        <PlayerSetup
          subtitle="You've been sent a card"
          title="Step in to read it"
          onReady={setProfile}
        />
      </div>
    );
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Opening…</div>;
  }

  const url = typeof window !== "undefined" ? `${window.location.origin}/async/${id}` : "";
  const isHost = session.host_name === profile.name;

  return (
    <div className="min-h-screen">
      <SiteHead />
      <main className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Async spiral · {session.host_name ?? "host"} & {isHost ? "guest" : profile.name}
        </div>

        <div className="rounded-2xl bg-card/40 border border-border p-3 mb-6 flex items-center justify-between gap-3">
          <code className="text-xs text-muted-foreground truncate flex-1">{url}</code>
          <CopyButton value={url} className="text-xs px-3 py-1.5 rounded-full border border-gold/60 text-gold hover:bg-gold/10">
            Copy invite
          </CopyButton>
        </div>

        {/* Thread */}
        <ul className="space-y-4">
          {answers.map((a, i) => {
            const card = cards.find((c) => c.id === a.card_id);
            const info = layerInfo(a.layer);
            const isMine = a.player_name === profile.name;
            // Reveal logic: your own answers are visible; others are visible only if YOU have replied to that card.
            // You "replied to" the card if a later answer in the thread is yours.
            const youRepliedAfter = !isMine && answers.slice(i + 1).some((x) => x.player_name === profile.name);
            const reveal = isMine || youRepliedAfter;
            return (
              <li
                key={a.id}
                className="rounded-2xl p-5 bg-card/70 border border-border"
                style={{ borderLeft: `3px solid ${info.color}` }}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar k={a.avatar_key} name={a.player_name} size={22} />
                  <span className="text-cream/90">{a.player_name}</span>
                  <span>· L{a.layer} · {info.name}</span>
                </div>
                {card && (
                  <p className="font-display text-lg mt-2 text-cream/95">{card.prompt}</p>
                )}
                {reveal ? (
                  <p className="mt-2 italic text-cream">"{a.text}"</p>
                ) : (
                  <p className="mt-2 italic text-muted-foreground/70 blur-sm select-none">
                    "{a.text.replace(/./g, "•")}"
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Reply box */}
        {pendingCard ? (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 text-center">
              Reply to unlock
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Speak honestly…"
              className="w-full bg-card/60 border border-border rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
            />
            <button
              onClick={reply}
              disabled={!text.trim() || busy}
              className="mt-3 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
            >
              {busy ? "Sending…" : "Reveal & send your answer"}
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center">
            {youJustReplied ? (
              <p className="text-sm text-muted-foreground">Sent. Share the link, or spiral deeper:</p>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting on the other side…</p>
            )}
            <button
              onClick={spiralOn}
              className="mt-4 px-5 py-2.5 rounded-full bg-accent/30 border border-accent text-cream hover:bg-accent/50 transition"
            >
              Spiral one layer deeper
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
