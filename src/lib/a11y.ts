import { useEffect, useState } from "react";

const KEY = "ts:a11y:reducedMotion";

/** Reads system + user preference. User override (true/false) wins. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const override = localStorage.getItem(KEY);
    if (override === "true") return setReduced(true);
    if (override === "false") return setReduced(false);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function getReducedMotionOverride(): "true" | "false" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "true" || v === "false" ? v : null;
}

export function setReducedMotionOverride(v: boolean | null) {
  if (typeof window === "undefined") return;
  if (v === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, String(v));
  window.dispatchEvent(new Event("ts:a11y-changed"));
}
