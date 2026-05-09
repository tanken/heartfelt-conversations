import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardStage, type GameAnswer, type GameCard } from "@/components/CardStage";
import { loadCoreCards } from "@/lib/cards";
import { SiteHead } from "@/components/SiteHead";
import { Spiral } from "@/components/Spiral";

export const Route = createFileRoute("/room/$code")({
  component: Room,
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.code} — Truth Spiral` },
      { name: "description", content: "Join this live spiral." },
      { property: "og:title", content: "You're invited into the Spiral" },
      { property: "og:description", content: `Join room ${params.code} on Truth Spiral.` },
    ],
  }),
});

type SessionRow = {
  id: string;
  room_code: string | null;
  current_layer: number;
  current_card_id: string | null;
  current_player_id: string | null;
  status: string;
};
type PlayerRow = { id: string; display_name: string; turn_order: number };
type AnswerRow = {
  id: string;
  card_id: string;
  layer: number;
  player_name: string;
  text: string;
  is_reflection: boolean;
  is_spiral: boolean;
  created_at: string;
};

function Room() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [me, setMe] = useState<PlayerRow | null>(null);
  const [name, setName] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Load
  useEffect(() => {
    loadCoreCards().then(setCards);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("room_code", code)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
        return;
      }
      setSession(data as SessionRow);
      const [{ data: ps }, { data: as }] = await Promise.all([
        supabase.from("session_players").select("*").eq("session_id", data.id).order("turn_order"),
        supabase.from("answers").select("*").eq("session_id", data.id).order("created_at"),
      ]);
      setPlayers((ps ?? []) as PlayerRow[]);
      setAnswers((as ?? []) as AnswerRow[]);

      const storedId = localStorage.getItem(`ts:player:${data.id}`);
      if (storedId) {
        const found = (ps ?? []).find((p) => p.id === storedId);
        if (found) setMe(found as PlayerRow);
      }
    })();
  }, [code]);

  // Realtime
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`room:${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `id=eq.${session.id}` }, (p) => {
        setSession((prev) => ({ ...(prev as SessionRow), ...(p.new as SessionRow) }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_players", filter: `session_id=eq.${session.id}` }, (p) => {
        setPlayers((prev) => [...prev, p.new as PlayerRow].sort((a, b) => a.turn_order - b.turn_order));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers", filter: `session_id=eq.${session.id}` }, (p) => {
        setAnswers((prev) => [...prev, p.new as AnswerRow]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  async function joinRoom() {
    if (!session || !name.trim()) return;
    const { data } = await supabase
      .from("session_players")
      .insert({ session_id: session.id, display_name: name.trim(), turn_order: players.length })
      .select("*")
      .single();
    if (data) {
      localStorage.setItem(`ts:player:${session.id}`, data.id);
      setMe(data as PlayerRow);
    }
  }

  const currentCard = useMemo(() => {
    if (!session?.current_card_id) return null;
    return cards.find((c) => c.id === session.current_card_id) ?? null;
  }, [session?.current_card_id, cards]);

  const activePlayer = useMemo(() => {
    if (!session?.current_player_id) return players[0]?.display_name;
    return players.find((p) => p.id === session.current_player_id)?.display_name;
  }, [session?.current_player_id, players]);

  const isMyTurn = !!me && session?.current_player_id === me.id;

  // Convert answers → GameAnswer[]
  const gameAnswers: GameAnswer[] = answers.map((a) => ({
    id: a.id,
    cardId: a.card_id,
    prompt: cards.find((c) => c.id === a.card_id)?.prompt ?? "",
    layer: a.layer,
    playerName: a.player_name,
    text: a.text,
    action: a.is_spiral ? "spiral" : a.is_reflection ? "reflect" : "answer",
    createdAt: new Date(a.created_at).getTime(),
  }));

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No spiral found with that code.</p>
        <button onClick={() => navigate({ to: "/" })} className="text-gold">← Home</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Spiral size={140} /><p className="text-muted-foreground text-sm">Opening room {code}…</p>
      </div>
    );
  }

  // Lobby
  if (!me) {
    return (
      <div className="min-h-screen">
        <SiteHead />
        <main className="max-w-md mx-auto px-6 pt-6 pb-16 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live room</div>
          <h1 className="font-display text-5xl tracking-[0.2em] mt-2 text-gold">{code}</h1>
          <p className="text-muted-foreground text-sm mt-3">
            {players.length === 0 ? "Be the first to step into the spiral." : `${players.length} already inside.`}
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            placeholder="Your name"
            className="mt-8 w-full bg-card/60 border border-border rounded-full px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <button
            disabled={!name.trim()}
            onClick={joinRoom}
            className="mt-4 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
          >
            Enter the spiral
          </button>

          <div className="mt-8">
            <button
              onClick={() => {
                const url = `${window.location.origin}/room/${code}`;
                navigator.clipboard.writeText(url);
              }}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-cream"
            >
              Copy invite link
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Room
  async function handleAnswer(a: { cardId: string; prompt: string; layer: number; playerName: string; text: string; action: "answer" | "reflect" | "spiral" }) {
    if (!session || !me) return;
    await supabase.from("answers").insert({
      session_id: session.id,
      card_id: a.cardId,
      player_id: me.id,
      player_name: a.playerName,
      layer: a.layer,
      text: a.text,
      is_reflection: a.action === "reflect",
      is_spiral: a.action === "spiral",
    });

    // Advance turn + pick next card
    const newCount = answers.filter((x) => x.layer === a.layer).length + 1;
    const nextLayer = newCount >= 3 && a.layer < 5 ? a.layer + 1 : a.layer;
    const pool = cards.filter((c) => c.layer === nextLayer && c.id !== a.cardId);
    const nextCard = pool[Math.floor(Math.random() * pool.length)];
    const idx = players.findIndex((p) => p.id === me.id);
    const nextPlayer = players[(idx + 1) % players.length];

    await supabase
      .from("sessions")
      .update({
        current_layer: nextLayer,
        current_card_id: nextCard?.id ?? null,
        current_player_id: nextPlayer?.id ?? null,
      })
      .eq("id", session.id);
  }

  async function startGame() {
    if (!session || !cards.length || !players.length) return;
    const first = cards.filter((c) => c.layer === 1)[Math.floor(Math.random() * cards.filter((c) => c.layer === 1).length)];
    await supabase
      .from("sessions")
      .update({
        current_card_id: first.id,
        current_player_id: players[0].id,
        current_layer: 1,
      })
      .eq("id", session.id);
  }

  function closeRoom(_answers: GameAnswer[]) {
    sessionStorage.setItem("ts:lastRecap", JSON.stringify({
      mode: "room",
      players: players.map((p) => p.display_name),
      answers: gameAnswers,
      ts: Date.now(),
    }));
    navigate({ to: "/recap/local" });
  }

  return (
    <div className="min-h-screen">
      <SiteHead />
      <div className="max-w-2xl mx-auto px-6 mb-4 flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Room <span className="text-gold tracking-[0.4em]">{code}</span> · {players.length} player{players.length === 1 ? "" : "s"}
        </div>
        <button
          onClick={() => {
            const url = `${window.location.origin}/room/${code}`;
            navigator.clipboard.writeText(url);
          }}
          className="text-xs text-muted-foreground hover:text-cream"
        >
          Copy invite
        </button>
      </div>

      {!session.current_card_id ? (
        <div className="max-w-md mx-auto px-6 text-center pt-6 pb-16">
          <p className="text-muted-foreground mb-6">
            Players in: {players.map((p) => p.display_name).join(", ")}
          </p>
          <button
            onClick={startGame}
            disabled={players.length < 1}
            className="px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
          >
            Begin the spiral
          </button>
          <p className="text-xs text-muted-foreground mt-4">Anyone can start once at least one player has joined.</p>
        </div>
      ) : (
        <CardStage
          cards={cards}
          players={players.map((p) => p.display_name)}
          autoAdvance={false}
          canPlay={isMyTurn}
          activePlayer={activePlayer}
          currentCard={currentCard}
          answersOverride={gameAnswers}
          onAnswer={handleAnswer}
          onClose={closeRoom}
        />
      )}
    </div>
  );
}
