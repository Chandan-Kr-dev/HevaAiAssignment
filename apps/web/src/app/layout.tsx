import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { getSiteUrl } from "@/lib/site-url";
import { ShinyText } from "@/components/ui/ShinyText";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Heva Store",
    template: "%s | Heva Store",
  },
  description: "Handpicked Indian goods, delivered with love.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Ambient layer: blueprint grid + a violet bloom under the header.
            Decorative only (aria-hidden, no pointers); header stays sticky
            z-50 and main/footer are positioned so they paint above it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
        >
          <div className="ambient-grid absolute inset-0" />
          <div className="absolute left-1/2 top-[-14rem] h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[110px]" />
        </div>

        {/* Layout stays a server component; AuthProvider is the client boundary. */}
        <AuthProvider>
          <Header />
          <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8">
            {children}
          </main>
        </AuthProvider>
        <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                Heva<span className="text-accent"> Store</span>
              </p>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">
                Handpicked Indian goods, delivered with love.
              </p>
            </div>
            <nav aria-label="Footer" className="flex gap-6 text-sm">
              <Link
                href="/"
                className="text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                Store
              </Link>
              <Link
                href="/orders"
                className="text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                Your orders
              </Link>
            </nav>
            <p className="text-sm text-zinc-500">
              <ShinyText
                text="Payments secured by Razorpay"
                color="#71717a"
                shineColor="#c4b5fd"
                speed={4}
              />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
