import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-950 antialiased">
        {/* Layout stays a server component; AuthProvider is the client boundary. */}
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
        </AuthProvider>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-500">
            Heva Store — handpicked Indian goods.
          </div>
        </footer>
      </body>
    </html>
  );
}
