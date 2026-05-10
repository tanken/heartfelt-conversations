/** localStorage helpers for resume / reconnect across live rooms. */

export type StoredRoom = {
  code: string;
  sessionId: string;
  playerId: string;
  updatedAt: number;
};

const PREFIX = "ts:room:";

export function rememberRoom(code: string, sessionId: string, playerId: string) {
  if (typeof window === "undefined") return;
  const v: StoredRoom = { code, sessionId, playerId, updatedAt: Date.now() };
  localStorage.setItem(PREFIX + code, JSON.stringify(v));
}

export function recallRoom(code: string): StoredRoom | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + code);
    return raw ? (JSON.parse(raw) as StoredRoom) : null;
  } catch {
    return null;
  }
}

export function forgetRoom(code: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + code);
}

export function listStoredRooms(): StoredRoom[] {
  if (typeof window === "undefined") return [];
  const out: StoredRoom[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      const v = JSON.parse(localStorage.getItem(k) || "");
      if (v?.code) out.push(v);
    } catch {}
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}
