"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const onOrders = pathname === "/orders" || pathname.startsWith("/orders/");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl min-w-0 items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className={`shrink-0 text-xl font-bold tracking-tight text-white ${FOCUS_RING}`}
        >
          Heva<span className="text-accent"> Store</span>
        </Link>
        {loading ? (
          <div
            aria-label="Loading account"
            className="h-9 w-28 animate-pulse rounded-full bg-white/10"
          />
        ) : user ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {user.avatarUrl ? (
              // Plain <img>: Google avatar hosts are not in next/image remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-2 ring-accent/60"
              />
            ) : null}
            <span className="hidden max-w-40 truncate text-sm font-medium text-zinc-200 sm:inline">
              {user.name}
            </span>
            <Link
              href="/orders"
              aria-current={onOrders ? "page" : undefined}
              className={`inline-flex min-h-[44px] shrink-0 items-center text-sm underline decoration-zinc-600 underline-offset-4 ${onOrders ? "font-semibold text-white" : "text-zinc-300"} ${FOCUS_RING}`}
            >
              Orders
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm text-zinc-200 ${FOCUS_RING}`}
            >
              Logout
            </button>
          </div>
        ) : (
          // Full-page navigation (not fetch): the OAuth dance starts with a
          // redirect, which fetch cannot perform for us.
          <a
            href="/api/auth/google"
            className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-accent px-5 text-sm font-medium text-white shadow-[0_0_24px_-6px_var(--color-accent)] ${FOCUS_RING}`}
          >
            Sign in with Google
          </a>
        )}
      </div>
    </header>
  );
}
