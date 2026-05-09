import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Spiral } from "@/components/Spiral";
import { SiteHead } from "@/components/SiteHead";
import { LAYERS } from "@/lib/spiral";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHead />

      <main className="relative z-10 flex-1 px-6">
        {/* Hero */}
        <section className="max-w-5xl mx-auto pt-10 pb-24 md:pt-20 md:pb-32 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6"
            >
              <span className="h-px w-8 bg-gold/60" /> A conversation game
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              className="font-display text-5xl md:text-7xl leading-[0.95] text-balance"
            >
              Spiral inward.<br />
              <span className="italic text-gold">Together.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground max-w-md text-pretty"
            >
              Five layers. One card at a time. Turn vulnerability into a game you actually want to play —
              alone, in person, or live with anyone in the world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                to="/play/local"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition"
              >
                Start a session
              </Link>
              <Link
                to="/room/new"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-border text-cream hover:bg-secondary/60 transition"
              >
                Create a live room
              </Link>
              <Link
                to="/play/solo"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-muted-foreground hover:text-cream transition"
              >
                Play solo →
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full" />
            <Spiral size={380} className="relative" />
          </motion.div>
        </section>

        {/* Layers */}
        <section className="max-w-5xl mx-auto pb-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">The five layers</p>
            <h2 className="font-display text-3xl md:text-4xl">Each turn pulls you one notch deeper.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {LAYERS.map((l, i) => (
              <motion.div
                key={l.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl p-5 bg-card/60 backdrop-blur border border-border"
                style={{ borderTop: `2px solid ${l.color}` }}
              >
                <div className="text-xs text-muted-foreground">0{l.n}</div>
                <div className="font-display text-xl mt-2" style={{ color: l.color }}>{l.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{l.tag}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto pb-32">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Draw", d: "A card surfaces from the current layer. No two sessions repeat." },
              { t: "Choose", d: "Answer honestly, reflect privately, or pull everyone into the spiral." },
              { t: "Share", d: "Beautiful answer cards. Connection recaps. Made for the feed." },
            ].map((s, i) => (
              <div key={s.t} className="rounded-2xl p-6 bg-card/40 border border-border">
                <div className="font-display text-3xl text-gold">0{i + 1}</div>
                <div className="font-display text-xl mt-2">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-2">{s.d}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 py-8 text-center text-xs text-muted-foreground border-t border-border/40">
        Made for deeper conversations.
      </footer>
    </div>
  );
}
