"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

// Gate for signed-in pages. Shows a sign-in card when logged out; never
// redirects in a loop (the user may just be passing through).
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        aria-label="Loading"
        className="mx-auto mt-16 h-40 max-w-md animate-pulse rounded-2xl bg-white/10"
      />
    );
  }

  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Please sign in</h1>
        <p className="mt-2 text-zinc-400">
          Sign in to see your orders and check out.
        </p>
        <a
          href="/api/auth/google"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-accent px-6 font-medium text-white shadow-[0_0_24px_-6px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
