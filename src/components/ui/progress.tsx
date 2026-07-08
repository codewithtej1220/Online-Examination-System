import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "default" | "success" | "warning" | "error" | "admin" | "faculty" | "student";
  animated?: boolean;
}

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

const colorClasses = {
  default: "bg-indigo-600",
  success: "bg-green-600",
  warning: "bg-amber-600",
  error: "bg-red-600",
  admin: "bg-gradient-to-r from-blue-600 to-cyan-500",
  faculty: "bg-gradient-to-r from-purple-600 to-pink-500",
  student: "bg-gradient-to-r from-emerald-500 to-teal-500",
};

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  size = "md",
  color = "default",
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="relative overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-full",
            sizeClasses[size],
            colorClasses[color]
          )}
        >
          {animated && (
            <div className="shimmer absolute inset-0" />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1 text-xs text-muted-foreground text-right"
        >
          {percentage.toFixed(0)}%
        </motion.p>
      )}
    </div>
  );
}
