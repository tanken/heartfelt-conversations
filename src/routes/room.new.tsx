import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadCoreDeckId } from "@/lib/cards";
import { makeRoomCode } from "@/lib/spiral";
import { Spiral } from "@/components/Spiral";

export const Route = createFileRoute("/room/new")({
  component: NewRoom,
});

function NewRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const deckId = await loadCoreDeckId();
      if (!deckId) return;
      // Try a few codes in case of collision
      for (let i = 0; i < 5; i++) {
        const code = makeRoomCode();
        const { data, error } = await supabase
          .from("sessions")
          .insert({ deck_id: deckId, mode: "room", room_code: code, status: "active" })
          .select("id, room_code")
          .single();
        if (!error && data) {
          navigate({ to: "/room/$code", params: { code: data.room_code! } });
          return;
        }
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Spiral size={180} />
      <p className="text-muted-foreground text-sm">Opening a new room…</p>
    </div>
  );
}
