import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { DEPTHS, pickPrompt, type Depth } from "@/lib/sparks/decks";
import { saveEntry, encodeShare, type SaveType } from "@/lib/sparks/storage";
import { useReducedMotion } from "@/lib/a11y";

const search = z.object({
  depth: z.enum(["light", "honest", "deep", "prayerful"]).default("light"),
  mode: z.enum(["solo", "friend", "group"]).default("solo"),
});

export const Route = createFileRoute("/sparks/draw")({
  validateSearch: search,
  component: SparksDraw,
});

const PLAYER_KEY = "liftd:sparks:players";

function SparksDraw() {
  const { depth, mode } = Route.useSearch();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const info = DEPTHS[depth];

  const [used, setUsed] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>(() => pickPrompt(depth));
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<SaveType | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Group mode: rotating players (pass-the-device)
  const [players, setPlayers] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["Player 1", "Player 2"];
    try { return JSON.parse(localStorage.getItem(PLAYER_KEY) || "null") ?? ["Player 1", "Player 2"]; }
    catch { return ["Player 1", "Player 2"]; }
  });
  const [turn, setTurn] = useState(0);
  const activePlayer = mode === "group" ? players[turn % players.length] : null;

  useEffect(() => {
    if (mode === "group" && typeof window !== "undefined") {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(players));
    }
  }, [players, mode]);

  function nextCard() {
    const nextUsed = [...used, prompt];
    setUsed(nextUsed);
    setPrompt(pickPrompt(depth, nextUsed));
    setText("");
    setSaved(null);
    setShareLink(null);
    setLinkCopied(false);
    if (mode === "group") setTurn((t) => t + 1);
  }

  function handleSave(type: SaveType) {
    if (!text.trim()) return;
    saveEntry({ prompt, answer: text.trim(), depth, type });
    setSaved(type);
  }

  async function handleShareToFriend() {
    const token = encodeShare({ prompt, depth, from: activePlayer ?? undefined });
    const url = `${window.location.origin}/sparks/share/${token}`;
    setShareLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
    } catch {
      /* ignore */
    }
  }

  const saveOptions = useMemo<{ k: SaveType; label: string }[]>(
    () => [
      { k: "reflection", label: "Reflection" },
      { k: "gratitude",  label: "Gratitude"  },
      { k: "prayer",     label: "Prayer"     },
      { k: "action",     label: "Action item" },
    ],
    [],
  );

  return (
    <div className="pt-3 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate({ to: "/sparks" })}
          className="text-xs underline-offset-4 hover:underline"
          style={{ color: "var(--sp-ink-soft)" }}
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--sp-ink-soft)" }}>
          <span aria-hidden style={{ color: info.color }}>{info.glyph}</span>
          {info.label} · {mode}
        </div>
      </div>

      {/* Group player editor */}
      {mode === "group" && (
        <div className="mb-4 sp-card p-3">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--sp-ink-soft)" }}>
            Pass to <span style={{ color: "var(--sp-ink)" }}>{activePlayer}</span>
          </div>
          <PlayerEditor players={players} setPlayers={setPlayers} />
        </div>
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={prompt}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="sp-card p-7 md:p-10 relative"
          style={{ borderTop: `4px solid ${info.color}` }}
          role="article"
          aria-label={`${info.label} prompt`}
        >
          <span
            className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest"
            style={{ background: info.color, color: "white" }}
          >
            {info.label}
          </span>
          <p className="font-display text-2xl md:text-3xl leading-snug text-balance text-center min-h-[5rem] flex items-center justify-center"
             style={{ color: "var(--sp-ink)" }}>
            {prompt}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave("reflection");
          } else if (e.key === "Escape") {
            setText("");
          }
        }}
        placeholder={mode === "friend"
          ? "Optional — write something to share, or just send the prompt…"
          : "Write your answer… (⌘/Ctrl+Enter to save as Reflection)"}
        rows={4}
        aria-label="Your answer"
        className="mt-5 w-full rounded-2xl p-4 resize-none outline-none focus-visible:ring-2"
        style={{
          background: "var(--sp-card)",
          color: "var(--sp-ink)",
          border: "1px solid var(--sp-border)",
        }}
      />

      {/* Action row */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={nextCard}
            className="px-4 py-2 rounded-full text-sm"
            style={{ border: "1px solid var(--sp-border)", color: "var(--sp-ink-soft)" }}
          >
            Pass
          </button>
          <button
            onClick={nextCard}
            className="px-4 py-2 rounded-full text-sm"
            style={{ border: "1px solid var(--sp-border)", color: "var(--sp-ink-soft)" }}
          >
            Shuffle
          </button>
        </div>
        {mode === "friend" && (
          <button
            onClick={handleShareToFriend}
            className="px-4 py-2 rounded-full text-sm"
            style={{ background: info.color, color: "white" }}
          >
            {linkCopied ? "Link copied ✓" : "Send to friend"}
          </button>
        )}
      </div>

      {shareLink && (
        <div className="mt-3 sp-card p-3 text-xs break-all" style={{ color: "var(--sp-ink-soft)" }}>
          {shareLink}
        </div>
      )}

      {/* Afterlife */}
      <section aria-labelledby="save-h" className="mt-8">
        <h2 id="save-h" className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "var(--sp-ink-soft)" }}>
          Save into your journal
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {saveOptions.map((opt) => (
            <button
              key={opt.k}
              onClick={() => handleSave(opt.k)}
              disabled={!text.trim()}
              className="px-4 py-3 rounded-xl text-sm text-left transition disabled:opacity-40"
              style={{
                background: saved === opt.k ? info.color : "var(--sp-card)",
                color: saved === opt.k ? "white" : "var(--sp-ink)",
                border: `1px solid ${saved === opt.k ? info.color : "var(--sp-border)"}`,
              }}
            >
              {saved === opt.k ? "Saved · " : "Save as "}{opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => alert("In Lift'd, this would post to your Connect feed.\n(Prototype only)")}
          disabled={!text.trim()}
          className="mt-2 w-full px-4 py-3 rounded-xl text-sm disabled:opacity-40"
          style={{ border: "1px dashed var(--sp-border)", color: "var(--sp-ink-soft)" }}
        >
          Share to Connect (preview)
        </button>
      </section>

      <div className="mt-8 text-center">
        <Link to="/sparks/reflections" className="text-xs underline" style={{ color: "var(--sp-ink-soft)" }}>
          View saved reflections →
        </Link>
      </div>
      <p className="mt-4 text-center text-[11px]" style={{ color: "var(--sp-ink-soft)" }}>
        You can always pass. Nothing is shared unless you choose to share it.
      </p>
    </div>
  );
}

function PlayerEditor({ players, setPlayers }: { players: string[]; setPlayers: (p: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((p, i) => (
        <input
          key={i}
          value={p}
          onChange={(e) => {
            const next = [...players];
            next[i] = e.target.value;
            setPlayers(next);
          }}
          className="text-sm rounded-full px-3 py-1"
          style={{ background: "var(--sp-bg)", color: "var(--sp-ink)", border: "1px solid var(--sp-border)" }}
        />
      ))}
      {players.length < 6 && (
        <button
          onClick={() => setPlayers([...players, `Player ${players.length + 1}`])}
          className="text-xs px-3 py-1 rounded-full"
          style={{ border: "1px dashed var(--sp-border)", color: "var(--sp-ink-soft)" }}
        >
          + Add player
        </button>
      )}
      {players.length > 2 && (
        <button
          onClick={() => setPlayers(players.slice(0, -1))}
          className="text-xs px-3 py-1 rounded-full"
          style={{ border: "1px dashed var(--sp-border)", color: "var(--sp-ink-soft)" }}
        >
          – Remove
        </button>
      )}
    </div>
  );
}
