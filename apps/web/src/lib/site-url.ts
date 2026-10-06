// Single source for the public site URL (metadata, sitemap, canonical links).
// Server-side only: reading these vars here never reaches the browser except
// through the rendered values themselves (plain strings, no secrets).
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ??
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
