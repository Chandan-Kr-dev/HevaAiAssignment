import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Rebuilt hourly: the catalog changes rarely, and entries only add up.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const products = await getProducts();
  return [
    { url: base, lastModified: now },
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: now,
    })),
  ];
}
