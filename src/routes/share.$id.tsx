import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHead } from "@/components/SiteHead";
import { ShareCard } from "@/components/ShareCard";
import { CopyButton } from "@/components/CopyButton";
import { downloadNodeAsPng } from "@/lib/share";
import { layerInfo } from "@/lib/spiral";
import { Avatar } from "@/lib/avatars";

export const Route = createFileRoute("/share/$id")({
  component: SharePage,
  head: ({ params }) => ({
    meta: [
      { title: "A Truth Spiral answer" },
      { name: "description", content: "An honest answer from the spiral." },
      { property: "og:title", content: "A Truth Spiral answer" },
      { property: "og:description", content: "An honest answer from the spiral." },
      { property: "og:url", content: `/share/${params.id}` },
    ],
  }),
});

type Row = {
  id: string;
  card_id: string;
  layer: number;
  player_name: string;
  avatar_key: string | null;
  text: string;
};

function SharePage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [notFound, setNotFound] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("answers")
        .select("id, card_id, layer, player_name, avatar_key, text")
        .eq("id", id)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
        return;
      }
      setRow(data as Row);
      const { data: c } = await supabase.from("cards").select("prompt").eq("id", data.card_id).maybeSingle();
      setPrompt(c?.prompt ?? "");
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">This answer isn't available.</p>
        <Link to="/" className="text-gold">← Home</Link>
      </div>
    );
  }

  if (!row) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const info = layerInfo(row.layer);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function exportPng() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await downloadNodeAsPng(cardRef.current, `truth-spiral-${id}.png`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHead />
      <main className="max-w-xl mx-auto px-6 pb-16">
        {/* Preview (scaled) */}
        <div className="rounded-3xl overflow-hidden border border-border shadow-card mx-auto" style={{ aspectRatio: "1080/1350", maxWidth: 480 }}>
          <div
            className="origin-top-left"
            style={{
              width: 1080,
              height: 1350,
              transform: "scale(0.444)",
              transformOrigin: "top left",
            }}
          >
            <ShareCard
              ref={cardRef}
              layer={row.layer}
              prompt={prompt}
              text={row.text}
              playerName={row.player_name}
              avatarKey={row.avatar_key}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-xs uppercase tracking-widest" style={{ color: info.color }}>
            Layer 0{row.layer} · {info.name}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Avatar k={row.avatar_key} name={row.player_name} size={22} />
            <span className="text-cream">{row.player_name}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={exportPng}
            disabled={exporting}
            className="px-5 py-2.5 rounded-full bg-gold text-primary-foreground font-medium disabled:opacity-40"
          >
            {exporting ? "Rendering…" : "Download as image"}
          </button>
          <CopyButton value={url} className="px-5 py-2.5 rounded-full border border-border hover:bg-secondary/60">
            Copy link
          </CopyButton>
          <Link to="/" className="px-5 py-2.5 rounded-full text-muted-foreground hover:text-cream">
            ← Home
          </Link>
        </div>
      </main>
    </div>
  );
}
