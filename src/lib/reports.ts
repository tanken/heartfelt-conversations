import { supabase } from "@/integrations/supabase/client";

export const REPORT_REASONS = [
  { key: "harmful", label: "Harmful or hateful" },
  { key: "personal", label: "Personal info" },
  { key: "spam", label: "Spam or off-topic" },
  { key: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

const HIDE_THRESHOLD = 3;

export async function submitReport(
  targetType: "answer" | "session",
  targetId: string,
  reason: ReportReason,
  detail?: string,
) {
  await supabase.from("reports").insert({
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail ?? null,
  });

  // Best-effort auto-hide for answers once threshold is hit.
  if (targetType === "answer") {
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "answer")
      .eq("target_id", targetId);
    if ((count ?? 0) >= HIDE_THRESHOLD) {
      await supabase.from("answers").update({ is_hidden: true }).eq("id", targetId);
    }
  }
}

export async function trackShareClick(targetType: "answer" | "session", targetId: string) {
  if (typeof window === "undefined") return;
  const dedupeKey = `ts:click:${targetType}:${targetId}`;
  if (sessionStorage.getItem(dedupeKey)) return;
  sessionStorage.setItem(dedupeKey, "1");
  try {
    await supabase.from("share_clicks").insert({
      target_type: targetType,
      target_id: targetId,
      referrer: document.referrer || null,
      ua: navigator.userAgent.slice(0, 200),
    });
  } catch {}
}
