"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type ShinyTextProps = {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  delay?: number;
};

// React Bits "ShinyText" (https://reactbits.dev/text-animations/shiny-text):
// a metallic sheen sweeps across static text. Reduced motion renders the
// same gradient text with the sweep parked off-screen (base colour only).
export function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "#b5b5b5",
  shineColor = "#ffffff",
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}: ShinyTextProps) {
  const reduceMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(direction === "left" ? 1 : -1);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame((time) => {
    if (disabled || isPaused || reduceMotion) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    elapsedRef.current += time - lastTimeRef.current;
    lastTimeRef.current = time;

    const cycleDuration = animationDuration + delayDuration;
    const cycleTime = elapsedRef.current % cycleDuration;

    if (!yoyo) {
      progress.set(
        cycleTime < animationDuration
          ? directionRef.current === 1
            ? (cycleTime / animationDuration) * 100
            : 100 - (cycleTime / animationDuration) * 100
          : directionRef.current === 1
            ? 100
            : 0,
      );
      return;
    }

    // yoyo: forward -> hold -> reverse -> hold.
    const fullCycle = cycleDuration * 2;
    const t = elapsedRef.current % fullCycle;
    const forward = directionRef.current === 1;
    if (t < animationDuration) {
      const p = (t / animationDuration) * 100;
      progress.set(forward ? p : 100 - p);
    } else if (t < cycleDuration) {
      progress.set(forward ? 100 : 0);
    } else if (t < cycleDuration + animationDuration) {
      const p = 100 - ((t - cycleDuration) / animationDuration) * 100;
      progress.set(forward ? p : 100 - p);
    } else {
      progress.set(forward ? 0 : 100);
    }
  });

  useEffect(() => {
    directionRef.current = direction === "left" ? 1 : -1;
    elapsedRef.current = 0;
    progress.set(0);
  }, [direction, progress]);

  // p=0 -> shine off the right edge, p=100 -> off the left edge.
  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  if (reduceMotion || disabled) {
    return (
      <span className={className} style={{ ...gradientStyle, backgroundPosition: "150% center" }}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
}
