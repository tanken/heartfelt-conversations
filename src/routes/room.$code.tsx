import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardStage, type GameAnswer, type GameCard } from "@/components/CardStage";
import { loadCoreCards } from "@/lib/cards";
import { SiteHead } from "@/components/SiteHead";
import { Spiral } from "@/components/Spiral";
import { PlayerSetup } from "@/components/PlayerSetup";
import { CopyButton } from "@/components/CopyButton";
import { Avatar } from "@/lib/avatars";
import { loadProfile, type Profile } from "@/lib/profile";
import { makeToken } from "@/lib/share";
import { rememberRoom, recallRoom, forgetRoom } from "@/lib/rooms";

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
  share_token: string | null;
};
type PlayerRow = { id: string; display_name: string; turn_order: number; avatar_key: string | null };
type AnswerRow = {
  id: string;
  card_id: string;
  layer: number;
  player_name: string;
  avatar_key: string | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [connState, setConnState] = useState<"connecting" | "live" | "reconnecting">("connecting");
  const reconnectAttempt = useRef(0);

  useEffect(() => { loadCoreCards().then(setCards); setProfile(loadProfile()); }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("sessions").select("*").eq("room_code", code).maybeSingle();
      if (!data) { setNotFound(true); return; }
      setSession(data as SessionRow);
      const [{ data: ps }, { data: as }] = await Promise.all([
        supabase.from("session_players").select("*").eq("session_id", data.id).order("turn_order"),
        supabase.from("answers").select("*").eq("session_id", data.id).order("created_at"),
      ]);
      setPlayers((ps ?? []) as PlayerRow[]);
      setAnswers((as ?? []) as AnswerRow[]);

      // Resume: prefer per-room store; fall back to legacy per-session key.
      const stored = recallRoom(code);
      const storedId = stored?.playerId ?? localStorage.getItem(`ts:player:${data.id}`);
      if (storedId) {
        const found = (ps ?? []).find((p) => p.id === storedId);
        if (found) {
          setMe(found as PlayerRow);
          rememberRoom(code, data.id, found.id);
        }
      }
    })();
  }, [code]);

  // Realtime channel with reconnect/backoff.
  useEffect(() => {
    if (!session) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function attach() {
      channel = supabase
        .channel(`room:${session!.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `id=eq.${session!.id}` }, (p) => {
          setSession((prev) => ({ ...(prev as SessionRow), ...(p.new as SessionRow) }));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_players", filter: `session_id=eq.${session!.id}` }, (p) => {
          setPlayers((prev) => prev.some((x) => x.id === (p.new as PlayerRow).id) ? prev : [...prev, p.new as PlayerRow].sort((a, b) => a.turn_order - b.turn_order));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers", filter: `session_id=eq.${session!.id}` }, (p) => {
          setAnswers((prev) => prev.some((x) => x.id === (p.new as AnswerRow).id) ? prev : [...prev, p.new as AnswerRow]);
        })
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setConnState("live");
            reconnectAttempt.current = 0;
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnState("reconnecting");
            const delay = Math.min(8000, 1000 * 2 ** reconnectAttempt.current);
            reconnectAttempt.current += 1;
            if (channel) supabase.removeChannel(channel);
            timer = setTimeout(() => { if (!cancelled) attach(); }, delay);
          }
        });
    }

    attach();

    // Heartbeat: refresh joined_at as a "last seen" so the player row stays warm.
    const heartbeat = setInterval(() => {
      const stored = recallRoom(code);
      if (stored?.playerId) {
        supabase.from("session_players").update({ joined_at: new Date().toISOString() }).eq("id", stored.playerId);
      }
    }, 15000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.id, code]);

  async function joinRoom(p: Profile) {
    if (!session) return;
    setProfile(p);
    const { data } = await supabase
      .from("session_players")
      .insert({ session_id: session.id, display_name: p.name, turn_order: players.length, avatar_key: p.avatar })
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

  // Lobby — choose name + avatar
  if (!me) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : "";
    return (
      <div className="min-h-screen">
        <SiteHead />
        <main className="max-w-md mx-auto px-6 pt-2 pb-16 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live room</div>
          <h1 className="font-display text-5xl tracking-[0.2em] mt-2 text-gold">{code}</h1>
          <p className="text-muted-foreground text-sm mt-3">
            {players.length === 0 ? "Be the first inside." : `${players.length} already inside.`}
          </p>

          {players.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/60 border border-border text-xs">
                  <Avatar k={p.avatar_key} name={p.display_name} size={18} />
                  {p.display_name}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3">
            <CopyButton value={url} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-cream">
              Copy invite link
            </CopyButton>
          </div>

          <PlayerSetup
            initial={profile}
            subtitle="Choose how you'll appear"
            title="Enter the spiral"
            ctaLabel="Enter"
            onReady={joinRoom}
          />
        </main>
      </div>
    );
  }

  async function handleAnswer(a: { cardId: string; prompt: string; layer: number; playerName: string; text: string; action: "answer" | "reflect" | "spiral" }) {
    if (!session || !me) return;
    await supabase.from("answers").insert({
      session_id: session.id,
      card_id: a.cardId,
      player_id: me.id,
      player_name: a.playerName,
      avatar_key: me.avatar_key,
      layer: a.layer,
      text: a.text,
      is_reflection: a.action === "reflect",
      is_spiral: a.action === "spiral",
    });
    const newCount = answers.filter((x) => x.layer === a.layer).length + 1;
    const nextLayer = newCount >= 3 && a.layer < 5 ? a.layer + 1 : a.layer;
    const pool = cards.filter((c) => c.layer === nextLayer && c.id !== a.cardId);
    const nextCard = pool[Math.floor(Math.random() * pool.length)];
    const idx = players.findIndex((p) => p.id === me.id);
    const nextPlayer = players[(idx + 1) % players.length];
    await supabase.from("sessions").update({
      current_layer: nextLayer,
      current_card_id: nextCard?.id ?? null,
      current_player_id: nextPlayer?.id ?? null,
    }).eq("id", session.id);
  }

  async function startGame() {
    if (!session || !cards.length || !players.length) return;
    const layer1 = cards.filter((c) => c.layer === 1);
    const first = layer1[Math.floor(Math.random() * layer1.length)];
    await supabase.from("sessions").update({
      current_card_id: first.id,
      current_player_id: players[0].id,
      current_layer: 1,
    }).eq("id", session.id);
  }

  async function closeRoom(_answers: GameAnswer[]) {
    if (!session) return;
    let token = session.share_token;
    if (!token) {
      token = makeToken();
      await supabase.from("sessions").update({ share_token: token, status: "closed", closed_at: new Date().toISOString() }).eq("id", session.id);
    }
    navigate({ to: "/recap/$id", params: { id: token } });
  }

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : "";

  return (
    <div className="min-h-screen">
      <SiteHead />
      <div className="max-w-2xl mx-auto px-6 mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          Room <span className="text-gold tracking-[0.4em]">{code}</span>
        </div>
        <div className="flex items-center gap-3">
          <CopyButton value={code} className="text-xs text-muted-foreground hover:text-cream">Copy code</CopyButton>
          <CopyButton value={inviteUrl} className="text-xs text-gold hover:underline">Copy invite link</CopyButton>
        </div>
      </div>

      {/* Player rail */}
      <div className="max-w-2xl mx-auto px-6 mb-4 flex flex-wrap gap-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition"
            style={{
              borderColor: session.current_player_id === p.id ? "var(--gold)" : "var(--border)",
              background: session.current_player_id === p.id ? "oklch(0.82 0.15 78 / 0.10)" : "transparent",
            }}
          >
            <Avatar k={p.avatar_key} name={p.display_name} size={18} ring={session.current_player_id === p.id} />
            <span className={session.current_player_id === p.id ? "text-cream" : "text-muted-foreground"}>{p.display_name}</span>
          </div>
        ))}
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
          dbBacked
          onAnswer={handleAnswer}
          onClose={closeRoom}
        />
      )}
    </div>
  );
}
