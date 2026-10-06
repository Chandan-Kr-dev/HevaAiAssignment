"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  children: ReactNode;
  radius?: number;
  color?: string;
  className?: string;
};

// Aceternity CardSpotlight idiom: a radial glow follows the cursor inside
// the card. Purely decorative (pointer-tracked overlay); content stays
// static server-rendered HTML, and reduced-motion users get no tracking.
export function SpotlightCard({
  children,
  radius = 350,
  color = "#7c3aed",
  className,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-radius);
  const mouseY = useMotionValue(-radius);
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}26, transparent 80%)`;

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) {
      return;
    }
    const { left, top } = ref.current.getBoundingClientRect();
    mouseX.set(event.clientX - left);
    mouseY.set(event.clientY - top);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn("group relative overflow-hidden rounded-2xl", className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={reduceMotion ? undefined : { background }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
