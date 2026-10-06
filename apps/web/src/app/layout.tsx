import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
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
        {/* Layout stays a server component; AuthProvider is the client boundary. */}
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
        </AuthProvider>
        <footer className="border-t border-white/10 bg-black/40">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-400">
            Heva Store — handpicked Indian goods.
          </div>
        </footer>
      </body>
    </html>
  );
}
