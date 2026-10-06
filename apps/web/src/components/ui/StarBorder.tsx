import React from "react";
import { cn } from "@/lib/utils";

// React Bits "StarBorder" (https://reactbits.dev/text-animations/star-border):
// a light streak sweeps across the top and bottom edges of the element.
// Keyframes live in globals.css (animate-star-movement-*) and are disabled
// under prefers-reduced-motion, which leaves the static border behind.
// Polymorphic (`as`) so it can be a button, link, or plain container.

type StarBorderProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties["animationDuration"];
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "children" | "className">;

export function StarBorder<T extends React.ElementType = "button">({
  as,
  className = "",
  innerClassName,
  color = "rgba(196, 181, 253, 0.9)",
  speed = "6s",
  thickness = 1,
  backgroundColor = "#12101a",
  textColor = "#ffffff",
  borderColor = "rgba(255,255,255,0.14)",
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as React.ElementType;

  return (
    <Component
      {...(rest as React.ComponentPropsWithoutRef<T>)}
      className={cn(
        "relative inline-block overflow-hidden rounded-[20px]",
        className,
      )}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as { style?: React.CSSProperties }).style,
      }}
    >
      <div
        aria-hidden="true"
        className="animate-star-movement-bottom absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        aria-hidden="true"
        className="animate-star-movement-top absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "relative z-10 rounded-[20px] border px-[26px] py-[16px] text-center text-[16px] leading-none",
          innerClassName,
        )}
        style={{ background: backgroundColor, color: textColor, borderColor }}
      >
        {children}
      </div>
    </Component>
  );
}
