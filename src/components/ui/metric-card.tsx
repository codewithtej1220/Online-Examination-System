import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "default" | "admin" | "faculty" | "student" | "success" | "warning" | "error";
  className?: string;
}

const colorClasses = {
  default: "from-indigo-500 to-purple-600",
  admin: "from-blue-600 to-cyan-500",
  faculty: "from-purple-600 to-pink-500",
  student: "from-emerald-500 to-teal-500",
  success: "from-green-500 to-emerald-600",
  warning: "from-amber-500 to-orange-500",
  error: "from-red-500 to-rose-600",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  color = "default",
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("card-hover overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  {value}
                </h3>
                {trend && (
                  <span
                    className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      trend.isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {description}
                </p>
              )}
            </div>
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                colorClasses[color]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
