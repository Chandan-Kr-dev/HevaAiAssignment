"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

// Plain DOM span props only (no motion-only props like onDrag/initial): the
// component must be able to render a plain <span> when motion is reduced.
type ShimmeringTextProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "children" | "color"
> & {
  text: string;
  duration?: number;
  wave?: boolean;
  color?: string;
  shimmeringColor?: string;
};

// Animate UI "Shimmering Text" (https://animate-ui.com): each character
// brightens in sequence on a loop. Reduced motion renders the plain string.
export function ShimmeringText({
  text,
  duration = 1,
  wave = false,
  color = "#a1a1aa",
  shimmeringColor = "#f4f4f5",
  ...props
}: ShimmeringTextProps) {
  const reduceMotion = useReducedMotion();
  const spanProps = props as HTMLMotionProps<"span">;

  if (reduceMotion) {
    return (
      <span {...props} style={{ ...props.style, color }}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      style={
        {
          "--shimmering-color": shimmeringColor,
          "--shimmering-base": color,
          color: "var(--shimmering-base)",
          position: "relative",
          display: "inline-block",
          perspective: "500px",
        } as React.CSSProperties
      }
      {...spanProps}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            transformStyle: "preserve-3d",
          }}
          initial={{
            ...(wave ? { scale: 1, rotateY: 0 } : {}),
            color: "var(--shimmering-base)",
          }}
          animate={{
            ...(wave
              ? { x: [0, 5, 0], y: [0, -5, 0], scale: [1, 1.1, 1], rotateY: [0, 15, 0] }
              : {}),
            color: [
              "var(--shimmering-base)",
              "var(--shimmering-color)",
              "var(--shimmering-base)",
            ],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: text.length * 0.05,
            delay: (i * duration) / text.length,
            ease: "easeInOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
