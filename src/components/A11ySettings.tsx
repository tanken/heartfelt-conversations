import { useEffect, useState } from "react";
import { getReducedMotionOverride, setReducedMotionOverride } from "@/lib/a11y";

export function A11ySettings() {
  const [override, setOverride] = useState<"true" | "false" | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOverride(getReducedMotionOverride());
  }, []);

  function update(v: "true" | "false" | null) {
    setOverride(v);
    setReducedMotionOverride(v === null ? null : v === "true");
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Accessibility settings"
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded"
      >
        Accessibility
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full mb-2 right-0 w-60 rounded-xl bg-card border border-border shadow-card p-3 text-left"
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Motion</div>
          <div className="space-y-1">
            {(
              [
                ["null", "System default"],
                ["false", "Full motion"],
                ["true", "Reduce motion"],
              ] as const
            ).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-1.5 hover:bg-secondary/40">
                <input
                  type="radio"
                  name="rm"
                  checked={override === (val === "null" ? null : (val as "true" | "false"))}
                  onChange={() => update(val === "null" ? null : (val as "true" | "false"))}
                  className="accent-gold"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
