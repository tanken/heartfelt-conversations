import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEPTHS } from "@/lib/sparks/decks";
import { listEntries, clearEntries, type SavedEntry, type SaveType } from "@/lib/sparks/storage";

export const Route = createFileRoute("/sparks/reflections")({
  component: ReflectionsPage,
  head: () => ({
    meta: [{ title: "Saved Sparks — Lift'd" }],
  }),
});

const TYPE_ORDER: SaveType[] = ["reflection", "gratitude", "prayer", "action"];
const TYPE_LABEL: Record<SaveType, string> = {
  reflection: "Reflections",
  gratitude: "Gratitude",
  prayer: "Prayers",
  action: "Action items",
};

function ReflectionsPage() {
  const [entries, setEntries] = useState<SavedEntry[]>([]);

  useEffect(() => {
    setEntries(listEntries());
  }, []);

  if (!entries.length) {
    return (
      <div className="pt-10 text-center">
        <p className="font-display text-2xl" style={{ color: "var(--sp-ink)" }}>No reflections yet.</p>
        <p className="mt-2 text-sm" style={{ color: "var(--sp-ink-soft)" }}>
          Draw a Spark and save your first answer.
        </p>
        <Link
          to="/sparks"
          className="mt-6 inline-block px-5 py-3 rounded-2xl font-display"
          style={{ background: "var(--sp-ink)", color: "white" }}
        >
          Start a Spark →
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-3 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl" style={{ color: "var(--sp-ink)" }}>Your journal</h1>
        <button
          onClick={() => {
            if (confirm("Clear all saved Sparks? This can't be undone.")) {
              clearEntries();
              setEntries([]);
            }
          }}
          className="text-xs underline"
          style={{ color: "var(--sp-ink-soft)" }}
        >
          Clear all
        </button>
      </div>

      {TYPE_ORDER.map((type) => {
        const list = entries.filter((e) => e.type === type);
        if (!list.length) return null;
        return (
          <section key={type} className="mt-7">
            <h2 className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "var(--sp-ink-soft)" }}>
              {TYPE_LABEL[type]} · {list.length}
            </h2>
            <ul className="space-y-2">
              {list.map((e) => (
                <li key={e.id} className="sp-card p-4">
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: DEPTHS[e.depth].color }}>
                    {DEPTHS[e.depth].label}
                  </div>
                  <div className="font-display mt-0.5" style={{ color: "var(--sp-ink)" }}>{e.prompt}</div>
                  <div className="text-sm italic mt-1" style={{ color: "var(--sp-ink-soft)" }}>"{e.answer}"</div>
                  <div className="text-[10px] mt-2" style={{ color: "var(--sp-ink-soft)" }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
