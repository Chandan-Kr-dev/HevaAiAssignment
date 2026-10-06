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

// Animate UI idiom: tactile press physics (subtle scale on hover/tap) plus a
// light sweep across the surface. Respects reduced motion by rendering a
// plain button with no animation props attached.
export function AnimatedButton({
  children,
  className,
  disabled,
  type = "button",
  onClick,
}: AnimatedButtonProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children}
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
      className={cn(
        "group relative overflow-hidden rounded-full bg-accent px-8 py-3 font-medium text-white disabled:opacity-50",
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
    </motion.button>
  );
}
