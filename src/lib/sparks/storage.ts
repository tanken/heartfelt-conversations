import type { Depth } from "./decks";

export type SaveType = "reflection" | "prayer" | "gratitude" | "action";

export interface SavedEntry {
  id: string;
  prompt: string;
  answer: string;
  depth: Depth;
  type: SaveType;
  createdAt: number;
}

const KEY = "liftd:sparks:reflections";

export function listEntries(): SavedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveEntry(entry: Omit<SavedEntry, "id" | "createdAt">): SavedEntry {
  const full: SavedEntry = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
  const all = [full, ...listEntries()].slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(all));
  return full;
}

export function clearEntries() {
  localStorage.removeItem(KEY);
}

// Friend-share encoding (no backend) — payload only contains the prompt + meta.
export function encodeShare(payload: { prompt: string; depth: Depth; from?: string }): string {
  const json = JSON.stringify(payload);
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeShare(token: string): { prompt: string; depth: Depth; from?: string } | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
