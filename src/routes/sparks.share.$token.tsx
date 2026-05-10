import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEPTHS, type Depth } from "@/lib/sparks/decks";
import { decodeShare } from "@/lib/sparks/storage";

export const Route = createFileRoute("/sparks/share/$token")({
  component: SparksShare,
  head: () => ({
    meta: [
      { title: "A Spark for you — Lift'd" },
      { name: "description", content: "Someone sent you a conversation prompt." },
      { property: "og:title", content: "A Spark for you" },
      { property: "og:description", content: "Open your card and reply." },
    ],
  }),
});

function SparksShare() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<{ prompt: string; depth: Depth; from?: string } | null>(null);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const p = decodeShare(token);
    if (!p) setBad(true);
    else setPayload(p);
  }, [token]);

  if (bad) {
    return (
      <div className="pt-8 text-center">
        <p className="font-display text-xl" style={{ color: "var(--sp-ink)" }}>This link looks broken.</p>
        <Link to="/sparks" className="mt-3 inline-block underline" style={{ color: "var(--sp-ink-soft)" }}>
          Start your own Spark →
        </Link>
      </div>
    );
  }
  if (!payload) return <div className="pt-10 text-center" style={{ color: "var(--sp-ink-soft)" }}>Opening…</div>;

  const info = DEPTHS[payload.depth];

  return (
    <div className="pt-4 pb-12">
      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--sp-ink-soft)" }}>
        {payload.from ? `${payload.from} sent you a Spark` : "A friend sent you a Spark"}
      </p>
      <div
        className="sp-card mt-3 p-7 md:p-10 relative"
        style={{ borderTop: `4px solid ${info.color}` }}
      >
        <span
          className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest"
          style={{ background: info.color, color: "white" }}
        >
          {info.label}
        </span>
        <p className="font-display text-2xl md:text-3xl leading-snug text-balance text-center min-h-[5rem] flex items-center justify-center"
           style={{ color: "var(--sp-ink)" }}>
          {payload.prompt}
        </p>
      </div>
      <button
        onClick={() => navigate({ to: "/sparks/draw", search: { depth: payload.depth, mode: "solo" } })}
        className="mt-6 w-full rounded-2xl px-5 py-4 font-display text-lg"
        style={{ background: "var(--sp-ink)", color: "white" }}
      >
        Reply privately →
      </button>
      <div className="mt-3 text-center">
        <Link to="/sparks" className="text-xs underline" style={{ color: "var(--sp-ink-soft)" }}>
          Or start your own Spark
        </Link>
      </div>
    </div>
  );
}
