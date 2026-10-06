"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type BlurTextProps = {
  text: string;
  delay?: number;
  stepDuration?: number;
  threshold?: number;
  rootMargin?: string;
  animateByWords?: boolean;
  direction?: "top" | "bottom";
  className?: string;
  onAnimationComplete?: () => void;
};

// React Bits BlurText (TS + Tailwind variant): words fade from blurred to
// sharp as they scroll into view. SSR renders plain readable text; the blur
// only ever applies client-side after mount, so first paint stays intact.
export function BlurText({
  text,
  delay = 200,
  stepDuration = 0.35,
  threshold = 0.1,
  rootMargin = "0px",
  animateByWords = false,
  direction = "top",
  className,
  onAnimationComplete,
}: BlurTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const parts = animateByWords ? text.split(" ") : text.split("");
  const y0 = direction === "top" ? "-30px" : "30px";

  if (reduceMotion) {
    return <p ref={ref} className={className}>{text}</p>;
  }

  return (
    <p ref={ref} className={cn("flex flex-wrap", className)}>
      {parts.map((part, index) => (
        <motion.span
          key={index}
          initial={{ filter: "blur(10px)", opacity: 0, y: y0 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: "0px" }}
          viewport={{ once: true, amount: threshold, margin: rootMargin }}
          transition={{
            duration: stepDuration,
            delay: (index * delay) / 1000,
            ease: "easeOut",
          }}
          onAnimationComplete={
            index === parts.length - 1 ? onAnimationComplete : undefined
          }
          className="inline-block will-change-[transform,filter]"
        >
          {part === " " ? "\u00A0" : part}
          {animateByWords && index < parts.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </p>
  );
}
