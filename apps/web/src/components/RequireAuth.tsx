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
        className="mx-auto mt-16 h-40 max-w-md animate-pulse rounded-xl bg-zinc-200"
      />
    );
  }

  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Please sign in</h1>
        <p className="mt-2 text-zinc-600">
          Sign in to see your orders and check out.
        </p>
        <a
          href="/api/auth/google"
          className="mt-6 inline-block rounded-full bg-zinc-950 px-6 py-2.5 font-medium text-white"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
