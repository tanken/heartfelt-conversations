export const LAYERS = [
  { n: 1, name: "Surface", tag: "Playful icebreakers", color: "var(--layer-1)" },
  { n: 2, name: "Story", tag: "Formative memories", color: "var(--layer-2)" },
  { n: 3, name: "Mirror", tag: "Self-perception", color: "var(--layer-3)" },
  { n: 4, name: "Shadow", tag: "Fears & regrets", color: "var(--layer-4)" },
  { n: 5, name: "Soul", tag: "Core truths", color: "var(--layer-5)" },
] as const;

export function layerInfo(n: number) {
  return LAYERS[Math.max(0, Math.min(4, n - 1))];
}

export function makeRoomCode(): string {
  // 6 letters, no I/O/L for clarity
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export type SpiralAction = "answer" | "reflect" | "spiral";
