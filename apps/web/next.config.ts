import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable streaming metadata: our product metadata must land in <head>
  // for every visitor, not stream late into <body>. DOM-based consumers
  // (Lighthouse, some scrapers) only look in <head>; crawlers get blocking
  // metadata either way. Cost is one local API fetch before first paint.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Catalog images live here now (plain https host allowlist, same as
      // above). No new image service, no local files, no placeholders.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    // A proxy ONLY so the session cookie stays same-origin in the browser.
    // No logic lives in Next.js: every /api/* request is forwarded to NestJS.
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
