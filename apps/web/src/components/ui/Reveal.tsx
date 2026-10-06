"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Tiny scroll-reveal wrapper for the redesign. Server (and first paint)
// render children fully visible in a plain div; the slide/fade only arms
// client-side after mount, so LCP/SEO content is never hidden waiting for
// JS. Transform-only animation means no layout shift, and
// prefers-reduced-motion renders the plain div permanently.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);

  // Arming is deferred to a frame callback (never synchronous setState):
  // the server and first paint always render children fully visible.
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  if (!armed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
