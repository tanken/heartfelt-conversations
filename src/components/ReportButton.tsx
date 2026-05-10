import { useState } from "react";
import { REPORT_REASONS, submitReport, type ReportReason } from "@/lib/reports";

interface Props {
  targetType: "answer" | "session";
  targetId: string;
  /** Compact text-only trigger by default. */
  className?: string;
}

export function ReportButton({ targetType, targetId, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function send() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitReport(targetType, targetId, reason, detail || undefined);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <span className={`text-[11px] uppercase tracking-widest text-muted-foreground ${className}`}>
        Reported · thank you
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Report this ${targetType}`}
        className={`text-[11px] uppercase tracking-widest text-muted-foreground hover:text-cream transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded ${className}`}
      >
        Report
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center px-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-card">
            <h2 id="report-title" className="font-display text-xl">Report this</h2>
            <p className="text-xs text-muted-foreground mt-1">
              We'll review and may hide it from future shares.
            </p>

            <fieldset className="mt-5 space-y-2">
              <legend className="sr-only">Reason</legend>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.key}
                  className="flex items-center gap-2 text-sm text-cream cursor-pointer rounded-lg p-2 hover:bg-secondary/40"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    className="accent-gold"
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>

            {reason === "other" && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Tell us more (optional)"
                rows={3}
                aria-label="Additional detail"
                className="mt-3 w-full bg-background/60 border border-border rounded-lg p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-cream"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={!reason || submitting}
                className="px-4 py-2 rounded-full text-sm bg-gold text-primary-foreground font-medium disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
