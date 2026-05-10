import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Spiral } from "@/components/Spiral";
import { SiteHead } from "@/components/SiteHead";
import { LAYERS } from "@/lib/spiral";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHead />

      <main className="relative z-10 flex-1 px-6">
        {/* Hero */}
        <section className="max-w-5xl mx-auto pt-8 pb-20 md:pt-16 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
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
              alone, in person, live, or async.
            </motion.p>

            {/* Three primary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mt-10 grid sm:grid-cols-3 gap-3"
            >
              <Link
                to="/play/solo"
                className="rounded-2xl p-4 bg-card/60 border border-border hover:bg-card transition group"
              >
                <div className="text-xs uppercase tracking-widest text-muted-foreground">01</div>
                <div className="font-display text-xl mt-1 group-hover:text-gold transition">Solo</div>
                <div className="text-xs text-muted-foreground mt-1">A private journal.</div>
              </Link>
              <Link
                to="/play/local"
                className="rounded-2xl p-4 bg-card/60 border border-border hover:bg-card transition group"
              >
                <div className="text-xs uppercase tracking-widest text-muted-foreground">02</div>
                <div className="font-display text-xl mt-1 group-hover:text-gold transition">In-person</div>
                <div className="text-xs text-muted-foreground mt-1">Pass the device.</div>
              </Link>
              <Link
                to="/room/new"
                className="rounded-2xl p-4 bg-gold text-primary-foreground hover:scale-[1.02] transition shadow-glow"
              >
                <div className="text-xs uppercase tracking-widest opacity-60">03</div>
                <div className="font-display text-xl mt-1">Live room</div>
                <div className="text-xs opacity-70 mt-1">Spiral with anyone.</div>
              </Link>
            </motion.div>

            {/* Join with code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex items-center gap-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && navigate({ to: "/room/$code", params: { code } })}
                placeholder="Have a code? ABCDEF"
                className="flex-1 bg-card/40 border border-border rounded-full px-4 py-2.5 tracking-[0.3em] uppercase text-center placeholder:tracking-normal placeholder:normal-case placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <button
                disabled={code.length !== 6}
                onClick={() => navigate({ to: "/room/$code", params: { code } })}
                className="px-5 py-2.5 rounded-full border border-gold/60 text-gold hover:bg-gold/10 disabled:opacity-30 transition"
              >
                Join
              </button>
            </motion.div>

            <div className="mt-4 text-xs text-muted-foreground">
              or{" "}
              <Link to="/async/new" className="text-gold hover:underline">send an async card →</Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full" />
            <Spiral size={380} className="relative" />
            <SpiralTrailer />
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
              { t: "Share", d: "Export beautiful answer cards and connection recaps. Made for the feed." },
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

const TRAILER_PROMPTS = [
  "What did you almost say today?",
  "When did you last feel truly seen?",
  "What part of you do you hide?",
  "What's the lie you most often tell yourself?",
  "What would you regret never saying?",
];

function SpiralTrailer() {
  return (
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[260px] h-12 overflow-hidden">
      <motion.div
        animate={{ y: [0, -48, -96, -144, -192, -240] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col gap-0"
      >
        {TRAILER_PROMPTS.map((p, i) => (
          <div
            key={i}
            className="h-12 flex items-center justify-center text-center text-sm italic font-display"
            style={{ color: LAYERS[i % 5].color }}
          >
            "{p}"
          </div>
        ))}
        <div className="h-12 flex items-center justify-center text-center text-sm italic font-display" style={{ color: LAYERS[0].color }}>
          "{TRAILER_PROMPTS[0]}"
        </div>
      </motion.div>
    </div>
  );
}
