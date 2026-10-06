"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { HoverBorderGradient } from "./ui/HoverBorderGradient";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";

// Responsive navbar: brand left, hamburger on mobile toggling a collapsible
// menu, inline controls on md+. Tabs unchanged (home, Orders, auth) — no new
// navigation items were added.
export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const onOrders = pathname === "/orders" || pathname.startsWith("/orders/");

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      {/* Hairline under the bar so the sticky edge glows instead of cutting. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent"
      />
      <div className="mx-auto flex h-16 max-w-6xl min-w-0 flex-wrap items-center justify-between gap-2 px-4">
        <Link
          href="/"
          onClick={closeMenu}
          className={`flex shrink-0 items-center gap-2.5 text-xl font-bold tracking-tight text-white ${FOCUS_RING}`}
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 via-accent to-fuchsia-500 text-sm font-black text-white shadow-[0_0_18px_-4px_rgba(124,58,237,0.9)]"
          >
            H
          </span>
          Heva<span className="text-accent"> Store</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="navbar-menu"
          aria-expanded={menuOpen}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white md:hidden ${FOCUS_RING}`}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="h-6 w-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M5 7h14M5 12h14M5 17h14"
            />
          </svg>
        </button>
        <div
          id="navbar-menu"
          className={`${menuOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
        >
          <div className="rounded-2xl border border-white/10 bg-[#12101a]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            {loading ? (
              <div
                aria-label="Loading account"
                className="h-9 w-28 animate-pulse rounded-full bg-white/10 md:ml-auto"
              />
            ) : user ? (
              <div className="flex min-w-0 flex-col gap-1 py-1 md:flex-row md:items-center md:gap-2 md:py-0 lg:gap-3">
                <div className="flex min-w-0 items-center gap-3 px-2 py-2 md:px-1 md:py-0">
                  {user.avatarUrl ? (
                    // Plain <img>: Google avatar hosts are not in next/image remotePatterns.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full p-[2px] ring-1 ring-violet-400/70"
                      style={{
                        background:
                          "linear-gradient(135deg, #a78bfa, #7c3aed, #e879f9)",
                      }}
                    />
                  ) : null}
                  <span className="max-w-40 truncate text-sm font-medium text-zinc-200">
                    {user.name}
                  </span>
                </div>
                <Link
                  href="/orders"
                  onClick={closeMenu}
                  aria-current={onOrders ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm transition-colors md:rounded-full ${onOrders ? "bg-white/10 font-semibold text-white ring-1 ring-inset ring-white/10" : "text-zinc-300 hover:bg-white/5 hover:text-white"} ${FOCUS_RING}`}
                >
                  Orders
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    void logout();
                  }}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm text-zinc-200 transition-colors hover:border-violet-400/50 hover:text-white md:w-auto ${FOCUS_RING}`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="py-1 md:py-0">
                {/* Full-page navigation (not fetch): the OAuth dance starts with a
                    redirect, which fetch cannot perform for us. */}
                <HoverBorderGradient
                  as="a"
                  href="/api/auth/google"
                  containerClassName={`min-h-[44px] ${FOCUS_RING}`}
                  className="flex min-h-[42px] items-center bg-accent"
                >
                  Sign in with Google
                </HoverBorderGradient>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
