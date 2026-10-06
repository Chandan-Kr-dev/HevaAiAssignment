"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
  type HTMLMotionProps,
  type SpringOptions,
} from "motion/react";

// Animate UI "Tilt" (https://animate-ui.com): pointer-tracked 3D tilt with
// spring damping, split into Tilt (perspective wrapper) + TiltContent (the
// part that rotates). Adapted from the registry version: the strict context
// and Slot helpers are inlined. Under reduced motion the pointer handlers
// are never attached, so both springs stay at 0deg — same node, no motion.

type TiltContextType = {
  sRX: MotionValue<number>;
  sRY: MotionValue<number>;
  transition: SpringOptions;
};

const TiltContext = React.createContext<TiltContextType | undefined>(undefined);

type TiltProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
  maxTilt?: number;
  perspective?: number;
  transition?: SpringOptions;
};

export function Tilt({
  maxTilt = 10,
  perspective = 800,
  style,
  transition = { stiffness: 300, damping: 25, mass: 0.5 },
  onMouseMove,
  onMouseLeave,
  children,
  ...props
}: TiltProps) {
  const reduceMotion = useReducedMotion();
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);

  const sRX = useSpring(rX, transition);
  const sRY = useSpring(rY, transition);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      rY.set((px * 2 - 1) * maxTilt);
      rX.set(-(py * 2 - 1) * maxTilt);
    },
    [maxTilt, rX, rY, onMouseMove],
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      rX.set(0);
      rY.set(0);
    },
    [rX, rY, onMouseLeave],
  );

  return (
    <TiltContext.Provider value={{ sRX, sRY, transition }}>
      <motion.div
        style={{
          perspective,
          transformStyle: "preserve-3d",
          willChange: "transform",
          ...style,
        }}
        onMouseMove={reduceMotion ? undefined : handleMouseMove}
        onMouseLeave={reduceMotion ? undefined : handleMouseLeave}
        {...props}
      >
        {children}
      </motion.div>
    </TiltContext.Provider>
  );
}

type TiltContentProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
  transition?: SpringOptions;
};

export function TiltContent({
  style,
  transition,
  children,
  ...props
}: TiltContentProps) {
  // Context read is unconditional (rules of hooks); a missing provider just
  // means no rotation values are wired up.
  const tilt = React.useContext(TiltContext);

  return (
    <motion.div
      style={
        tilt
          ? {
              rotateX: tilt.sRX,
              rotateY: tilt.sRY,
              willChange: "transform",
              ...style,
            }
          : style
      }
      transition={transition ?? tilt?.transition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
