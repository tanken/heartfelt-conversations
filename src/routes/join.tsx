import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHead } from "@/components/SiteHead";

export const Route = createFileRoute("/join")({
  component: Join,
  head: () => ({
    meta: [
      { title: "Join a room — Truth Spiral" },
      { name: "description", content: "Enter a 6-letter code to join a live spiral." },
    ],
  }),
});

function Join() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <SiteHead />
      <main className="max-w-md mx-auto px-6 pt-10 pb-16 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live virtual room</div>
        <h1 className="font-display text-4xl mt-2">Join the spiral</h1>
        <p className="text-muted-foreground text-sm mt-3">Enter the 6-letter code from your host.</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))}
          placeholder="ABCDEF"
          className="mt-8 w-full text-center text-3xl font-display tracking-[0.4em] bg-card/60 border border-border rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />

        <button
          disabled={code.length !== 6}
          onClick={() => navigate({ to: "/room/$code", params: { code } })}
          className="mt-6 w-full px-6 py-3 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
        >
          Enter room
        </button>
      </main>
    </div>
  );
}
