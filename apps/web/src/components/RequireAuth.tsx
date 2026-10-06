"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { HoverBorderGradient } from "./ui/HoverBorderGradient";
import { ShimmeringText } from "./ui/ShimmeringText";

// Gate for signed-in pages. Shows a sign-in card when logged out; never
// redirects in a loop (the user may just be passing through).
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        aria-label="Loading"
        className="mx-auto mt-16 h-40 max-w-md animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
      />
    );
  }

  if (!user) {
    return (
      <div className="relative mx-auto mt-16 max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        {/* Violet bloom behind the card so it reads as a spotlighted panel. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl"
        />
        <div className="relative">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 via-accent to-fuchsia-500 text-lg font-black text-white shadow-[0_0_24px_-6px_rgba(124,58,237,0.9)]">
            H
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">Please sign in</h1>
          <p className="mt-2 text-zinc-400">
            Sign in to see your orders and check out.
          </p>
          <div className="mt-6 flex justify-center">
            <HoverBorderGradient
              as="a"
              href="/api/auth/google"
              containerClassName="min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              className="flex min-h-[42px] items-center bg-accent"
            >
              Sign in with Google
            </HoverBorderGradient>
          </div>
          <p className="mt-6 text-xs text-zinc-500">
            <ShimmeringText
              text="One tap with Google. No passwords stored."
              color="#71717a"
              shimmeringColor="#c4b5fd"
            />
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
