"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const PARTICLE_COLORS = [
  "#7c3aed",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#ffffff",
];
const PARTICLE_COUNT = 28;

// One-shot celebration burst for the PENDING -> PAID moment. Purely
// presentational: reads no data, calls no API. Particles use golden-angle
// positions (deterministic, so SSR and hydration render identically) and
// end invisible; reduced motion renders nothing at all.
export function ConfettiBurst({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = ((i * 137.5) % 360) * (Math.PI / 180);
        const distance = 90 + ((i * 53) % 90);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 40;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/3 h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y, opacity: 0, rotate: (i * 89) % 360 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
