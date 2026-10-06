"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

// React Bits "CountUp" (https://reactbits.dev/text-animations/count-up):
// spring-driven number that counts up once it scrolls into view. Reduced
// motion skips the spring entirely and renders the final value immediately.

type CountUpProps = {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
};

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
}: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  const maxDecimals = Math.max(
    (from.toString().split(".")[1] ?? "").length,
    (to.toString().split(".")[1] ?? "").length,
  );

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const formatted = new Intl.NumberFormat("en-IN", {
        useGrouping: separator.length > 0,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      }).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    // No ref under reduced motion: the effect is a no-op and the static
    // children below stay authoritative.
    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen && !reduceMotion) {
      const id = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);
      return () => clearTimeout(id);
    }
  }, [isInView, startWhen, reduceMotion, motionValue, direction, from, to, delay]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
  }, [springValue, formatValue, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{formatValue(to)}</span>;
  }

  return <span className={className} ref={ref} />;
}
