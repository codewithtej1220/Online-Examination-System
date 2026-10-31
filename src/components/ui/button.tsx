import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "relative inline-flex min-h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.1),inset_0_1px_0_rgb(255_255_255/0.15)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
        outline:
          "border border-border bg-background/80 font-medium shadow-[0_1px_2px_rgb(15_23_42/0.05)] backdrop-blur hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-background hover:shadow-md",
        soft: "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/15 dark:text-indigo-300",
        destructive: "bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25",
        premium:
          "btn-sheen overflow-hidden bg-[linear-gradient(110deg,#4f46e5,#7c3aed_45%,#4f46e5)] bg-[length:200%_100%] bg-left text-white shadow-[0_8px_20px_-8px_rgb(79_70_229/0.7),inset_0_1px_0_rgb(255_255_255/0.25)] hover:-translate-y-0.5 hover:bg-right hover:shadow-[0_14px_28px_-10px_rgb(79_70_229/0.8),inset_0_1px_0_rgb(255_255_255/0.25)]"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 min-h-9 rounded-lg px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
