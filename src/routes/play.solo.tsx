import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHead } from "@/components/SiteHead";
import { CardStage, type GameAnswer } from "@/components/CardStage";
import { PlayerSetup } from "@/components/PlayerSetup";
import { loadCoreCards } from "@/lib/cards";
import { loadProfile, type Profile } from "@/lib/profile";
import type { GameCard } from "@/components/CardStage";

export const Route = createFileRoute("/play/solo")({
  component: SoloPlay,
  head: () => ({
    meta: [
      { title: "Solo — Truth Spiral" },
      { name: "description", content: "A reflective journal mode. Just you and the spiral." },
    ],
  }),
});

function SoloPlay() {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCoreCards().then(setCards);
    setProfile(loadProfile());
  }, []);

  function handleClose(answers: GameAnswer[]) {
    sessionStorage.setItem("ts:lastRecap", JSON.stringify({
      mode: "solo",
      players: [profile?.name ?? "You"],
      answers,
      ts: Date.now(),
    }));
    navigate({ to: "/recap/local" });
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <SiteHead />
        <PlayerSetup
          subtitle="Solo · reflection"
          title="Just you and the spiral"
          onReady={setProfile}
        />
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading the deck…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHead />
      <div className="text-center mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Solo · {profile.name}
      </div>
      <CardStage
        cards={cards}
        players={[profile.name]}
        onAnswer={async () => {}}
        onClose={handleClose}
      />
    </div>
  );
}
