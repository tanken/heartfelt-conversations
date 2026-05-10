import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHead } from "@/components/SiteHead";
import { CardStage, type GameAnswer, type GameCard } from "@/components/CardStage";
import { loadCoreCards } from "@/lib/cards";

export const Route = createFileRoute("/play/local")({
  component: LocalPlay,
  head: () => ({
    meta: [
      { title: "In-person — Truth Spiral" },
      { name: "description", content: "Pass-and-play with the people in the room." },
    ],
  }),
});

function LocalPlay() {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCoreCards().then(setCards);
  }, []);

  function addPlayer() {
    const n = draft.trim();
    if (!n || players.length >= 8) return;
    setPlayers((p) => [...p, n]);
    setDraft("");
  }

  function handleClose(answers: GameAnswer[]) {
    sessionStorage.setItem("ts:lastRecap", JSON.stringify({
      mode: "local",
      players,
      answers,
      ts: Date.now(),
    }));
    navigate({ to: "/recap/local" });
  }

  if (!started) {
    return (
      <div className="min-h-screen">
        <SiteHead />
        <div className="max-w-md mx-auto px-6 pt-6 pb-12">
          <div className="text-center mb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">In-person</div>
            <h1 className="font-display text-3xl mt-2">Who's playing?</h1>
            <p className="text-muted-foreground text-sm mt-2">Add 2–8 players, then pass the device on each turn.</p>
          </div>

          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              placeholder="Player name"
              className="flex-1 bg-card/60 border border-border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            <button
              onClick={addPlayer}
              className="px-4 py-2.5 rounded-full bg-secondary text-cream hover:bg-secondary/80"
            >
              Add
            </button>
          </div>

          {players.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {players.map((p, i) => (
                <li key={i} className="px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                  {p}
                  <button onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))} className="ml-2 text-muted-foreground hover:text-destructive">×</button>
                </li>
              ))}
            </ul>
          )}

          <button
            disabled={players.length < 1 || !cards.length}
            onClick={() => setStarted(true)}
            className="mt-10 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium shadow-glow disabled:opacity-40"
          >
            Begin the spiral
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHead />
      <div className="text-center mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        In-person · {players.length} player{players.length === 1 ? "" : "s"}
      </div>
      <CardStage
        cards={cards}
        players={players}
        onAnswer={async () => {}}
        onClose={handleClose}
      />
    </div>
  );
}
