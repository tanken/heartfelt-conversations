import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sparks")({
  component: SparksLayout,
  head: () => ({
    meta: [
      { title: "Sparks — A Lift'd conversation prompt" },
      { name: "description", content: "Move from scrolling to meaningful conversation. A Connect feature for Lift'd." },
      { property: "og:title", content: "Sparks — Lift'd" },
      { property: "og:description", content: "Light, Honest, Deep, and Prayerful prompts to spark real conversation." },
    ],
  }),
});

function SparksLayout() {
  return (
    <div className="sparks-scope">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between max-w-2xl mx-auto">
        <Link to="/sparks" className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
            style={{ background: "var(--sp-amber)", color: "white" }}
            aria-hidden
          >
            ✶
          </span>
          <span className="font-display text-lg" style={{ color: "var(--sp-ink)" }}>
            Sparks
          </span>
          <span
            className="ml-2 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--sp-ink-soft)" }}
          >
            Lift'd · Connect
          </span>
        </Link>
        <Link
          to="/sparks/reflections"
          className="text-xs underline-offset-4 hover:underline"
          style={{ color: "var(--sp-ink-soft)" }}
        >
          Reflections
        </Link>
      </header>
      <main className="px-5 pb-16 max-w-2xl mx-auto">
        <Outlet />
      </main>
      <footer className="text-center py-6 text-[11px]" style={{ color: "var(--sp-ink-soft)" }}>
        Prototype · A sister concept to{" "}
        <Link to="/" className="underline">Truth Spiral</Link>
      </footer>
    </div>
  );
}
