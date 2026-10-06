"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

// Aceternity "Hover Border Gradient" (https://ui.aceternity.com/components/hover-border-gradient),
// ported for Tailwind v4 + the store palette: a light highlight orbits the
// pill's 1px edge and blooms inward on hover. Reduced motion freezes the
// orbit so the edge keeps a steady glow.

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

const DIRECTIONS: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

function rotateDirection(current: Direction, clockwise: boolean): Direction {
  const index = DIRECTIONS.indexOf(current);
  const next = clockwise
    ? (index - 1 + DIRECTIONS.length) % DIRECTIONS.length
    : (index + 1) % DIRECTIONS.length;
  return DIRECTIONS[next];
}

const MOVING_MAP: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  BOTTOM:
    "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  RIGHT:
    "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
};

// Aceternity ships #3275F8 here; ours is the store accent so the glow reads
// as part of the brand.
const HIGHLIGHT =
  "radial-gradient(75% 181% at 50% 50%, #7c3aed 0%, rgba(124, 58, 237, 0) 100%)";

type HoverBorderGradientProps<C extends React.ElementType = "button"> = {
  as?: C;
  containerClassName?: string;
  className?: string;
  duration?: number;
  clockwise?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<C>, "children">;

export function HoverBorderGradient<C extends React.ElementType = "button">({
  children,
  containerClassName,
  className,
  as,
  duration = 1,
  clockwise = true,
  ...props
}: HoverBorderGradientProps<C>) {
  const Tag = (as ?? "button") as React.ElementType;
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  // The idle orbit is a timer, not an animation frame; skip it entirely when
  // motion is reduced (direction stays TOP = a steady glow on the top edge),
  // and while hovered so the bloom animation owns the edge.
  useEffect(() => {
    if (hovered || reduceMotion) {
      return;
    }
    const timer = setInterval(() => {
      setDirection((prev) => rotateDirection(prev, clockwise));
    }, duration * 1000);
    return () => clearInterval(timer);
  }, [hovered, reduceMotion, duration, clockwise]);

  return (
    <Tag
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center overflow-visible rounded-full border border-white/15 bg-white/[0.04] p-px decoration-clone transition-colors duration-500 hover:bg-white/[0.07]",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "relative z-10 w-auto rounded-[inherit] bg-[#0b0b0f] px-5 py-2.5 text-center text-sm font-medium text-white",
          className,
        )}
      >
        {children}
      </div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(2px)" }}
        initial={{ background: MOVING_MAP[direction] }}
        animate={{
          background: hovered
            ? [MOVING_MAP[direction], HIGHLIGHT]
            : MOVING_MAP[direction],
        }}
        transition={{ ease: "linear", duration: reduceMotion ? 0 : duration }}
      />
      {/* Masks the interior so the orbit only reads along the 1px edge. */}
      <div className="absolute inset-[1px] z-[1] rounded-full bg-[#0b0b0f]" />
    </Tag>
  );
}
