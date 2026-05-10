import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHead } from "@/components/SiteHead";
import { LAYERS } from "@/lib/spiral";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const KEY = "ts:admin:unlocked";

function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");
  const expected = (import.meta.env.VITE_ADMIN_KEY as string | undefined) ?? "spiral";

  useEffect(() => {
    if (sessionStorage.getItem(KEY) === "1") setUnlocked(true);
  }, []);

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <SiteHead />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwd === expected) {
              sessionStorage.setItem(KEY, "1");
              setUnlocked(true);
            }
          }}
          className="w-full max-w-sm space-y-3"
        >
          <h1 className="font-display text-2xl">Admin</h1>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Admin key"
            aria-label="Admin key"
            className="w-full bg-card/40 border border-border rounded-full px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          />
          <button className="w-full px-5 py-2.5 rounded-full bg-gold text-primary-foreground font-medium">Unlock</button>
        </form>
      </div>
    );
  }

  return <Dashboard />;
}

type Session = { id: string; mode: string; status: string; created_at: string; closed_at: string | null; share_token: string | null; room_code: string | null };
type AnsRow = { session_id: string; layer: number; id: string; player_name: string; text: string; is_hidden: boolean };
type Click = { target_type: string; target_id: string };
type Report = { id: string; target_type: string; target_id: string; reason: string; detail: string | null; created_at: string };

function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [answers, setAnswers] = useState<AnsRow[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    (async () => {
      const [s, a, c, r] = await Promise.all([
        supabase.from("sessions").select("id, mode, status, created_at, closed_at, share_token, room_code").order("created_at", { ascending: false }).limit(500),
        supabase.from("answers").select("session_id, layer, id, player_name, text, is_hidden").limit(2000),
        supabase.from("share_clicks").select("target_type, target_id").limit(2000),
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setSessions((s.data ?? []) as Session[]);
      setAnswers((a.data ?? []) as AnsRow[]);
      setClicks((c.data ?? []) as Click[]);
      setReports((r.data ?? []) as Report[]);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const today = sessions.filter((s) => now - new Date(s.created_at).getTime() < day).length;
    const week = sessions.filter((s) => now - new Date(s.created_at).getTime() < day * 7).length;
    const byMode: Record<string, number> = {};
    sessions.forEach((s) => { byMode[s.mode] = (byMode[s.mode] ?? 0) + 1; });

    const depthBySession: Record<string, number> = {};
    answers.forEach((a) => { depthBySession[a.session_id] = Math.max(depthBySession[a.session_id] ?? 0, a.layer); });
    const depthDist = [0, 0, 0, 0, 0];
    Object.values(depthBySession).forEach((d) => { if (d >= 1 && d <= 5) depthDist[d - 1]++; });

    const clicksByAnswer: Record<string, number> = {};
    const clicksBySession: Record<string, number> = {};
    clicks.forEach((c) => {
      if (c.target_type === "answer") clicksByAnswer[c.target_id] = (clicksByAnswer[c.target_id] ?? 0) + 1;
      else clicksBySession[c.target_id] = (clicksBySession[c.target_id] ?? 0) + 1;
    });
    const topAnswers = Object.entries(clicksByAnswer)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 8)
      .map(([id, count]) => {
        const a = answers.find((x) => x.id === id);
        return { id, count, player: a?.player_name ?? "—", text: a?.text ?? "" };
      });
    const totalClicks = clicks.length;

    return { today, week, total: sessions.length, byMode, depthDist, topAnswers, totalClicks };
  }, [sessions, answers, clicks]);

  async function hideAnswer(id: string) {
    await supabase.from("answers").update({ is_hidden: true }).eq("id", id);
    setAnswers((prev) => prev.map((a) => (a.id === id ? { ...a, is_hidden: true } : a)));
  }

  return (
    <div className="min-h-screen">
      <SiteHead />
      <main className="max-w-5xl mx-auto px-6 pb-16">
        <h1 className="font-display text-3xl">Admin · Truth Spiral</h1>
        <p className="text-xs text-muted-foreground mt-1">Internal dashboard</p>

        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat v={stats.today} l="Rooms today" />
          <Stat v={stats.week} l="Last 7 days" />
          <Stat v={stats.total} l="All-time sessions" />
          <Stat v={stats.totalClicks} l="Share clicks" />
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
          <Panel title="By mode">
            <ul className="text-sm space-y-1">
              {Object.entries(stats.byMode).map(([k, v]) => (
                <li key={k} className="flex justify-between"><span className="capitalize text-muted-foreground">{k}</span><span className="text-cream">{v}</span></li>
              ))}
              {!Object.keys(stats.byMode).length && <li className="text-muted-foreground">No sessions yet.</li>}
            </ul>
          </Panel>

          <Panel title="Completion depth (max layer reached)">
            <div className="flex items-end gap-2 h-32">
              {LAYERS.map((l, i) => {
                const v = stats.depthDist[i];
                const max = Math.max(1, ...stats.depthDist);
                return (
                  <div key={l.n} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">{v}</div>
                    <div className="w-full rounded-md" style={{ height: `${(v / max) * 100}%`, background: l.color, minHeight: 4, opacity: v ? 1 : 0.25 }} />
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.name}</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section className="mt-8">
          <Panel title="Top shared answers">
            <ul className="divide-y divide-border">
              {stats.topAnswers.map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{a.player}</div>
                    <div className="truncate italic">"{a.text}"</div>
                  </div>
                  <div className="text-gold tabular-nums">{a.count}</div>
                  <a href={`/share/${a.id}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-cream">↗</a>
                </li>
              ))}
              {!stats.topAnswers.length && <li className="text-muted-foreground text-sm py-2">No share clicks yet.</li>}
            </ul>
          </Panel>
        </section>

        <section className="mt-8">
          <Panel title={`Reports (${reports.length})`}>
            <ul className="divide-y divide-border">
              {reports.map((r) => {
                const ans = r.target_type === "answer" ? answers.find((a) => a.id === r.target_id) : null;
                return (
                  <li key={r.id} className="py-3 flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        {r.target_type} · {r.reason} · {new Date(r.created_at).toLocaleString()}
                      </div>
                      {ans && (
                        <div className={`truncate italic ${ans.is_hidden ? "line-through opacity-50" : ""}`}>
                          "{ans.text}" — {ans.player_name}
                        </div>
                      )}
                      {r.detail && <div className="text-xs text-muted-foreground mt-1">{r.detail}</div>}
                    </div>
                    {ans && !ans.is_hidden && (
                      <button
                        onClick={() => hideAnswer(ans.id)}
                        className="text-xs px-3 py-1 rounded-full border border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        Hide
                      </button>
                    )}
                  </li>
                );
              })}
              {!reports.length && <li className="text-muted-foreground text-sm py-2">No reports.</li>}
            </ul>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Stat({ v, l }: { v: number; l: string }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-border p-4">
      <div className="font-display text-3xl text-gold">{v}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card/40 border border-border p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}
