"use client";

import { motion, useReducedMotion } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

// Primary CTA physics (subtle scale on hover/tap) plus a light sweep across
// the surface, over a violet gradient pill with an inset highlight. Respects
// reduced motion by rendering a plain button with no animation props.
export function AnimatedButton({
  children,
  className,
  disabled,
  type = "button",
  onClick,
}: AnimatedButtonProps) {
  const reduceMotion = useReducedMotion();

  // Same visual in both branches; only the motion props differ.
  const baseClass = cn(
    "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-violet-400 via-accent to-violet-700 px-8 py-3 font-semibold text-white ring-1 ring-inset ring-white/20 transition-[filter] brightness-100 hover:brightness-110 disabled:opacity-50",
    className,
  );

  if (reduceMotion) {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={baseClass}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={baseClass}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
    </motion.button>
  );
}
