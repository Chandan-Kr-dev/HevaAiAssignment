"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
  type SpringOptions,
} from "motion/react";

type MagneticProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  strength?: number;
  range?: number;
  springOptions?: SpringOptions;
  onlyOnHover?: boolean;
  disableOnTouch?: boolean;
};

// Animate UI "Magnetic" (https://animate-ui.com): the wrapper drifts toward
// the cursor within `range` pixels and springs back. Adapted from the
// registry version: no Slot/asChild (we always wrap). Reduced motion and
// touch devices keep the same node but attach no listener, so the springs
// stay parked at 0 and nothing ever moves.
export function Magnetic({
  children,
  strength = 0.5,
  range = 120,
  springOptions = { stiffness: 100, damping: 10, mass: 0.5 },
  onlyOnHover = false,
  disableOnTouch = true,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}: MagneticProps) {
  const reduceMotion = useReducedMotion();
  const localRef = React.useRef<HTMLDivElement>(null);

  const isTouchDevice = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer:coarse)").matches;
  }, []);

  const inert = Boolean(reduceMotion) || (disableOnTouch && isTouchDevice);

  const [active, setActive] = React.useState(!onlyOnHover);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, springOptions);
  const y = useSpring(rawY, springOptions);

  const compute = React.useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!localRef.current) return;
      const { left, top, width, height } =
        localRef.current.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if ((active || !onlyOnHover) && dist <= range) {
        const factor = (1 - dist / range) * strength;
        rawX.set(dx * factor);
        rawY.set(dy * factor);
      } else {
        rawX.set(0);
        rawY.set(0);
      }
    },
    [active, onlyOnHover, range, strength, rawX, rawY],
  );

  React.useEffect(() => {
    if (inert) return;
    const handle = (e: MouseEvent) => compute(e);
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [compute, inert]);

  return (
    <motion.div
      ref={localRef}
      style={{ display: "inline-block", ...style, x, y }}
      onMouseEnter={(e) => {
        if (inert) return;
        if (onlyOnHover) setActive(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (inert) return;
        if (onlyOnHover) setActive(false);
        rawX.set(0);
        rawY.set(0);
        onMouseLeave?.(e);
      }}
      onMouseMove={(e) => {
        if (inert) return;
        if (onlyOnHover) compute(e);
        onMouseMove?.(e);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
