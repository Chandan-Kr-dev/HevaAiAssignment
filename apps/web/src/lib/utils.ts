import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard conditional-class helper used by every staged ui component.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
