import { motion } from "framer-motion";

/** Animated cosmic spiral motif. */
export function Spiral({ size = 320, className = "" }: { size?: number; className?: string }) {
  const arms = 4;
  const points = 140;
  const paths: string[] = [];
  for (let a = 0; a < arms; a++) {
    let d = "";
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = t * Math.PI * 6 + (a * Math.PI * 2) / arms;
      const r = t * (size / 2 - 10);
      const x = size / 2 + Math.cos(angle) * r;
      const y = size / 2 + Math.sin(angle) * r;
      d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
    >
      <defs>
        <radialGradient id="spiralGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.82 0.15 78)" stopOpacity="0.9" />
          <stop offset="40%" stopColor="oklch(0.55 0.22 305)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.30 0.10 280)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="url(#spiralGrad)" opacity="0.35" />
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="url(#spiralGrad)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}
      <circle cx={size / 2} cy={size / 2} r="3" fill="oklch(0.96 0.02 80)" />
    </motion.svg>
  );
}
