import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
        warning:
          "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        destructive:
          "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
        error:
          "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
        info:
          "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        admin:
          "border-blue-500/50 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 text-blue-700 dark:text-blue-400",
        faculty:
          "border-purple-500/50 bg-gradient-to-r from-purple-600/10 to-pink-500/10 text-purple-700 dark:text-purple-400",
        student:
          "border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </div>
  );
}
