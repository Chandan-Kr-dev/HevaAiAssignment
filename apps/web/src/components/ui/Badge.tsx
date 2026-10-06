"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "pending" | "paid" | "failed" | "info";

const TONES: Record<BadgeTone, string> = {
  pending: "bg-amber-400/15 text-amber-200",
  paid: "bg-emerald-400/15 text-emerald-200",
  failed: "bg-red-400/15 text-red-200",
  info: "bg-violet-400/15 text-violet-200",
};

const DOT: Record<BadgeTone, string> = {
  pending: "bg-amber-300",
  paid: "bg-emerald-300",
  failed: "bg-red-300",
  info: "bg-violet-300",
};

// Animate UI idiom: status pill with a softly pulsing dot. Tones are tuned
// for the dark storefront (light text on translucent tints, all above 4.5:1
// on #0b0b0f). Reduced motion renders the same pill with a static dot.
export function Badge({
  tone = "info",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <span
      className={cn(
        "inline-flex min-h-[28px] items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ring-white/10 backdrop-blur-sm",
        TONES[tone],
        className,
      )}
    >
      {reduceMotion ? (
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", DOT[tone])} />
      ) : (
        <motion.span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", DOT[tone])}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {children}
    </span>
  );
}
