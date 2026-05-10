import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { layerInfo, LAYERS, type SpiralAction } from "@/lib/spiral";
import { shareAnswer } from "@/lib/share";
import { ReportButton } from "@/components/ReportButton";
import { useReducedMotion } from "@/lib/a11y";

export type GameCard = { id: string; layer: number; prompt: string };
export type GameAnswer = {
  id: string;
  cardId: string;
  prompt: string;
  layer: number;
  playerName: string;
  text: string;
  action: SpiralAction;
  createdAt: number;
};

interface CardStageProps {
  cards: GameCard[];
  players: string[];
  /** Called when a player commits an answer. */
  onAnswer: (a: Omit<GameAnswer, "id" | "createdAt">) => void | Promise<void>;
  /** Called when the spiral closes. */
  onClose: (answers: GameAnswer[]) => void;
  /** Externally-controlled answers (e.g. realtime). When omitted, internal state. */
  answersOverride?: GameAnswer[];
  /** External current card (for live rooms). */
  currentCard?: GameCard | null;
  /** Auto-advance behavior — true for solo/local, false when host syncs. */
  autoAdvance?: boolean;
  /** When false, hide action buttons (e.g. spectator). */
  canPlay?: boolean;
  /** Override the active player's name (for live rooms). */
  activePlayer?: string;
  /** Hook called when picking next card (live rooms). */
  onPickNext?: (card: GameCard) => void;
  /** When true, answers shown have real DB ids and a Share button appears. */
  dbBacked?: boolean;
}

export function CardStage({
  cards,
  players,
  onAnswer,
  onClose,
  answersOverride,
  currentCard: externalCard,
  autoAdvance = true,
  canPlay = true,
  activePlayer,
  onPickNext,
  dbBacked = false,
}: CardStageProps) {
  const [layer, setLayer] = useState(1);
  const [internalCard, setInternalCard] = useState<GameCard | null>(null);
  const [internalAnswers, setInternalAnswers] = useState<GameAnswer[]>([]);
  const [turn, setTurn] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const usedRef = useRef<Set<string>>(new Set());
  const reduced = useReducedMotion();

  const answers = answersOverride ?? internalAnswers;
  const card = externalCard ?? internalCard;

  // Promote layer when 3 answers in current layer have been given
  useEffect(() => {
    const inLayer = answers.filter((a) => a.layer === layer).length;
    if (inLayer >= 3 && layer < 5) {
      setLayer((l) => Math.min(5, l + 1));
    }
  }, [answers, layer]);

  // Auto-pick next card when there is none
  useEffect(() => {
    if (!autoAdvance) return;
    if (card) return;
    pickCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, layer, autoAdvance]);

  function pickCard() {
    const pool = cards.filter((c) => c.layer === layer && !usedRef.current.has(c.id));
    const fallback = cards.filter((c) => c.layer === layer);
    const list = pool.length ? pool : fallback;
    if (!list.length) return;
    const next = list[Math.floor(Math.random() * list.length)];
    usedRef.current.add(next.id);
    setInternalCard(next);
    onPickNext?.(next);
  }

  const playerName = activePlayer ?? players[turn % players.length] ?? "You";
  const info = layerInfo(layer);

  async function commit(action: SpiralAction) {
    if (!card || submitting) return;
    if (action !== "reflect" && !text.trim()) return;
    setSubmitting(true);
    const payload = {
      cardId: card.id,
      prompt: card.prompt,
      layer: card.layer,
      playerName,
      text: action === "reflect" ? "(reflected privately)" : text.trim(),
      action,
    };
    try {
      await onAnswer(payload);
      if (!answersOverride) {
        setInternalAnswers((a) => [
          ...a,
          { ...payload, id: crypto.randomUUID(), createdAt: Date.now() },
        ]);
      }
      setText("");
      setTurn((t) => t + 1);
      if (autoAdvance) {
        setInternalCard(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pb-12">
      {/* Layer indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {LAYERS.map((l) => (
            <div
              key={l.n}
              className="h-1.5 w-8 rounded-full transition-all"
              style={{
                background: l.n <= layer ? l.color : "oklch(1 0 0 / 0.1)",
                boxShadow: l.n === layer ? `0 0 16px ${l.color}` : "none",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => onClose(answers)}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-cream transition"
        >
          Close spiral
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Layer 0{layer} · {info.name}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {card && (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30, rotate: -2, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, rotate: 2, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-8 md:p-12 bg-card/80 backdrop-blur shadow-card border border-border"
            style={{ borderTop: `3px solid ${info.color}` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest"
              style={{ background: info.color, color: "oklch(0.16 0.04 280)" }}>
              {info.name}
            </div>
            <p className="font-display text-2xl md:text-3xl leading-snug text-balance text-center min-h-[6rem] flex items-center justify-center">
              {card.prompt}
            </p>
            <div className="mt-2 text-center text-sm text-muted-foreground">
              for <span className="text-cream">{playerName}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input + actions */}
      {canPlay && card && (
        <div className="mt-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Speak honestly…"
            rows={3}
            className="w-full bg-card/60 border border-border rounded-2xl p-4 text-cream placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
          />
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              disabled={submitting || !text.trim()}
              onClick={() => commit("answer")}
              className="px-5 py-2.5 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40 hover:scale-[1.02] transition"
            >
              Answer
            </button>
            <button
              disabled={submitting}
              onClick={() => commit("reflect")}
              className="px-5 py-2.5 rounded-full border border-border text-muted-foreground hover:text-cream transition disabled:opacity-40"
            >
              Reflect privately
            </button>
            {players.length > 1 && (
              <button
                disabled={submitting || !text.trim()}
                onClick={() => commit("spiral")}
                className="px-5 py-2.5 rounded-full bg-accent/30 border border-accent text-cream hover:bg-accent/50 transition disabled:opacity-40"
              >
                Spiral everyone
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent answers */}
      {answers.length > 0 && (
        <div className="mt-12">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">The spiral so far</div>
          <ul className="space-y-3">
            {answers.slice(-5).reverse().map((a) => (
              <li key={a.id} className="rounded-2xl p-4 bg-card/40 border border-border">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{a.playerName} · L{a.layer}</span>
                  <span className="capitalize">{a.action}</span>
                </div>
                <p className="font-display mt-1 text-cream/95">{a.prompt}</p>
                {a.action !== "reflect" && (
                  <p className="text-sm text-muted-foreground mt-1 italic">"{a.text}"</p>
                )}
                {dbBacked && a.action !== "reflect" && (
                  <button
                    onClick={async () => {
                      const url = await shareAnswer(a.id);
                      window.open(url, "_blank");
                    }}
                    className="mt-2 text-[11px] uppercase tracking-widest text-gold hover:underline"
                  >
                    Share this answer →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!card && !autoAdvance && (
        <div className="text-center mt-12 text-muted-foreground">Waiting for the next card…</div>
      )}

      {/* Help nav */}
      <div className="text-center mt-12">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-cream">
          ← Home
        </Link>
      </div>
    </div>
  );
}
