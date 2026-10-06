import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
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
