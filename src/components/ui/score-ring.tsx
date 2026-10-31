import { motion } from "framer-motion";

/** Circular percentage indicator, coloured by performance band. */
export function ScoreRing({ percent, size = 96, stroke = 9, label }: { percent: number; size?: number; stroke?: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = clamped >= 75 ? "#10b981" : clamped >= 50 ? "#6366f1" : clamped >= 35 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold leading-none">{Math.round(clamped)}%</p>
        {label && <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
