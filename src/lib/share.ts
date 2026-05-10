import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";

export async function downloadNodeAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    backgroundColor: "#0b0a18",
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** Mark an answer as shared (idempotent) and return the share URL. */
export async function shareAnswer(answerId: string): Promise<string> {
  await supabase.from("answers").update({ is_shared: true }).eq("id", answerId);
  return `${window.location.origin}/share/${answerId}`;
}

export function makeToken(): string {
  // url-safe random token
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}
