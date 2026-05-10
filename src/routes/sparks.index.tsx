import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEPTHS, type Depth } from "@/lib/sparks/decks";
import { listEntries, type SavedEntry } from "@/lib/sparks/storage";

export const Route = createFileRoute("/sparks/")({
  component: SparksHome,
});

type Mode = "solo" | "friend" | "group";

function SparksHome() {
  const [depth, setDepth] = useState<Depth>("light");
  const [mode, setMode] = useState<Mode>("solo");
  const [recent, setRecent] = useState<SavedEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecent(listEntries().slice(0, 3));
  }, []);

  return (
    <div className="pt-3 pb-8">
      <h1 className="font-display text-3xl md:text-4xl leading-tight" style={{ color: "var(--sp-ink)" }}>
        A better way to start the conversation.
      </h1>
      <p className="mt-2 text-sm md:text-base" style={{ color: "var(--sp-ink-soft)" }}>
        Pick a depth. Draw a card. Answer it, save it, or send it to someone you love.
        You can always pass.
      </p>

      <section aria-labelledby="depth-h" className="mt-7">
        <h2 id="depth-h" className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "var(--sp-ink-soft)" }}>
          Choose a depth
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(DEPTHS) as Depth[]).map((d) => {
            const info = DEPTHS[d];
            const active = depth === d;
            return (
              <button
                key={d}
                onClick={() => setDepth(d)}
                aria-pressed={active}
                className="text-left rounded-2xl p-4 transition"
                style={{
                  background: active ? info.color : "var(--sp-card)",
                  color: active ? "white" : "var(--sp-ink)",
                  border: `1px solid ${active ? info.color : "var(--sp-border)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden>{info.glyph}</span>
                  <span className="font-display text-lg">{info.label}</span>
                </div>
                <div className="text-xs mt-1 opacity-80">{info.tag}</div>
              </button>
            );
          })}
        </div>
        {depth === "prayerful" && (
          <p className="mt-3 text-xs" style={{ color: "var(--sp-ink-soft)" }}>
            Faith-shaped, gentle, and inclusive. Use it if it fits — skip if it doesn't.
          </p>
        )}
      </section>

      <section aria-labelledby="mode-h" className="mt-7">
        <h2 id="mode-h" className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "var(--sp-ink-soft)" }}>
          How are you playing?
        </h2>
        <div className="flex gap-2 flex-wrap">
          {([
            { k: "solo",   label: "Solo" },
            { k: "friend", label: "With a friend" },
            { k: "group",  label: "Group round" },
          ] as { k: Mode; label: string }[]).map(({ k, label }) => {
            const active = mode === k;
            return (
              <button
                key={k}
                onClick={() => setMode(k)}
                aria-pressed={active}
                className="px-4 py-2 rounded-full text-sm transition"
                style={{
                  background: active ? "var(--sp-ink)" : "transparent",
                  color: active ? "white" : "var(--sp-ink)",
                  border: `1px solid ${active ? "var(--sp-ink)" : "var(--sp-border)"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={() => navigate({ to: "/sparks/draw", search: { depth, mode } })}
        className="mt-8 w-full rounded-2xl px-5 py-4 font-display text-lg transition hover:scale-[1.01]"
        style={{ background: "var(--sp-ink)", color: "white" }}
      >
        Draw a Spark →
      </button>

      {recent.length > 0 && (
        <section aria-labelledby="recent-h" className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-h" className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--sp-ink-soft)" }}>
              Recent reflections
            </h2>
            <Link to="/sparks/reflections" className="text-xs underline" style={{ color: "var(--sp-ink-soft)" }}>
              See all
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="sp-card p-3">
                <div className="text-[10px] uppercase tracking-widest" style={{ color: DEPTHS[r.depth].color }}>
                  {DEPTHS[r.depth].label} · {r.type}
                </div>
                <div className="font-display mt-0.5" style={{ color: "var(--sp-ink)" }}>{r.prompt}</div>
                <div className="text-sm italic mt-1" style={{ color: "var(--sp-ink-soft)" }}>"{r.answer}"</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
