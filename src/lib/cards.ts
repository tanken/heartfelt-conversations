import { supabase } from "@/integrations/supabase/client";
import type { GameCard } from "@/components/CardStage";

export async function loadCoreCards(): Promise<GameCard[]> {
  const { data: deck } = await supabase.from("decks").select("id").eq("slug", "core").single();
  if (!deck) return [];
  const { data } = await supabase
    .from("cards")
    .select("id, layer, prompt")
    .eq("deck_id", deck.id);
  return (data ?? []) as GameCard[];
}

export async function loadCoreDeckId(): Promise<string | null> {
  const { data } = await supabase.from("decks").select("id").eq("slug", "core").single();
  return data?.id ?? null;
}
