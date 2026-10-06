"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Heva Store
        </Link>
        {loading ? (
          <div
            aria-label="Loading account"
            className="h-9 w-28 animate-pulse rounded-full bg-zinc-200"
          />
        ) : user ? (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // Plain <img>: Google avatar hosts are not in next/image remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : null}
            <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
              {user.name}
            </span>
            <Link href="/orders" className="text-sm underline">
              Orders
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          // Full-page navigation (not fetch): the OAuth dance starts with a
          // redirect, which fetch cannot perform for us.
          <a
            href="/api/auth/google"
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in with Google
          </a>
        )}
      </div>
    </header>
  );
}
