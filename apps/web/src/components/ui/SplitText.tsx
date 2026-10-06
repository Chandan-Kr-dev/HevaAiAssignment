"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type SplitTextProps = {
  text: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  splitBy?: "chars" | "words";
  className?: string;
  onAnimationComplete?: () => void;
};

// React Bits SplitText (TS + Tailwind variant): staggered rise-in per
// character (or word) on scroll into view. SSR renders plain readable text;
// animation state only exists client-side after mount.
export function SplitText({
  text,
  delay = 100,
  duration = 0.6,
  threshold = 0.1,
  rootMargin = "0px",
  splitBy = "chars",
  className,
  onAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const parts = splitBy === "words" ? text.split(" ") : text.split("");

  if (reduceMotion) {
    return <p ref={ref} className={className}>{text}</p>;
  }

  return (
    <p
      ref={ref}
      aria-label={text}
      className={cn("flex flex-wrap", className)}
    >
      {parts.map((part, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          initial={{ opacity: 0, y: "0.35em" }}
          whileInView={{ opacity: 1, y: "0em" }}
          viewport={{ once: true, amount: threshold, margin: rootMargin }}
          transition={{
            duration,
            delay: (index * delay) / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={
            index === parts.length - 1 ? onAnimationComplete : undefined
          }
          className="inline-block will-change-transform"
        >
          {part === " " ? "\u00A0" : part}
          {splitBy === "words" && index < parts.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </p>
  );
}
