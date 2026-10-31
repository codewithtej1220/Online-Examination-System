import * as React from "react";
import { cn } from "../../lib/utils";

type TiltCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Maximum rotation in degrees */
  maxTilt?: number;
  /** Colour of the cursor spotlight + border glow (any CSS colour) */
  glow?: string;
  /** Lift the card towards the viewer on hover */
  lift?: boolean;
};

const canTilt = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Card with a 3D perspective tilt that follows the cursor, a soft spotlight
 * under the pointer and a glowing border highlight. Pointer position is
 * written straight to CSS variables so hovering never re-renders React.
 * Touch devices and reduced-motion users get a static card.
 */
export const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ className, children, maxTilt = 8, glow = "99 102 241", lift = true, style, ...props }, forwardedRef) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
    const frame = React.useRef<number>(0);

    function handleMove(event: React.PointerEvent<HTMLDivElement>) {
      const node = ref.current;
      if (!node || !canTilt()) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        node.style.setProperty("--rx", `${(0.5 - y) * maxTilt * 2}deg`);
        node.style.setProperty("--ry", `${(x - 0.5) * maxTilt * 2}deg`);
        node.style.setProperty("--mx", `${x * 100}%`);
        node.style.setProperty("--my", `${y * 100}%`);
        node.dataset.active = "true";
      });
    }

    function handleLeave() {
      const node = ref.current;
      if (!node) return;
      cancelAnimationFrame(frame.current);
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
      node.dataset.active = "false";
    }

    return (
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ ...style, ["--glow" as string]: glow }}
        className={cn("tilt-card group/tilt", lift && "tilt-card--lift", className)}
        {...props}
      >
        <div className="tilt-card__spotlight" aria-hidden="true" />
        <div className="tilt-card__content">{children}</div>
      </div>
    );
  }
);
TiltCard.displayName = "TiltCard";
