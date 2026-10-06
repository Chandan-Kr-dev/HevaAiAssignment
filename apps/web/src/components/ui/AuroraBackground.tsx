"use client";

import { cn } from "@/lib/utils";

// Aceternity "Aurora Background" (https://ui.aceternity.com/components/aurora-background),
// reduced to a decorative layer for this always-dark store: the original
// wraps children in a 100vh main and inverts itself for light themes, which
// we don't need. Mount inside a `relative` section; content stays on top and
// the wash never intercepts pointers. The drift lives in globals.css
// (.aurora-layer) so prefers-reduced-motion can park it in one place.
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "aurora-layer pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    />
  );
}
