import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";

function originFromRequest(): string {
  try {
    const host = getRequestHost();
    const proto = getRequestHeader("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  } catch {}
  return "";
}

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export const getShareMeta = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const origin = originFromRequest();
    const { data: ans } = await supabase
      .from("answers")
      .select("id, card_id, layer, player_name, text, is_hidden, is_reflection")
      .eq("id", data.id)
      .maybeSingle();

    if (!ans || ans.is_hidden || ans.is_reflection) {
      return { origin, title: "Truth Spiral", description: "A conversational card game.", hidden: !!ans?.is_hidden };
    }

    const { data: card } = await supabase
      .from("cards")
      .select("prompt")
      .eq("id", ans.card_id)
      .maybeSingle();

    return {
      origin,
      hidden: false,
      title: truncate(card?.prompt ?? "An honest answer", 80),
      description: `${ans.player_name} on Truth Spiral · "${truncate(ans.text, 130)}"`,
    };
  });

export const getRecapMeta = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const origin = originFromRequest();
    let s = await supabase.from("sessions").select("id").eq("share_token", data.id).maybeSingle();
    if (!s.data) s = await supabase.from("sessions").select("id").eq("id", data.id).maybeSingle();
    if (!s.data) {
      return { origin, title: "Connection Recap", description: "A spiral, captured." };
    }
    const { data: ans } = await supabase
      .from("answers")
      .select("layer, player_name")
      .eq("session_id", s.data.id);
    const deepest = Math.max(0, ...(ans ?? []).map((a) => a.layer));
    const players = Array.from(new Set((ans ?? []).map((a) => a.player_name)));
    const layerNames = ["Surface", "Story", "Mirror", "Shadow", "Soul"];
    const layerName = layerNames[Math.max(0, deepest - 1)] ?? "Surface";
    return {
      origin,
      title: `We reached ${layerName} together`,
      description: `${players.length} player${players.length === 1 ? "" : "s"} · ${ans?.length ?? 0} cards drawn · Truth Spiral`,
    };
  });
