import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";

// Rebuilt hourly: the catalog changes rarely, and entries only add up.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  let products: Array<{ slug: string }> = [];
  try {
    products = await getProducts();
  } catch {
    // A catalog outage must not fail the build: ship home-only and let the
    // hourly revalidation pick the products back up.
    return [{ url: base, lastModified: now }];
  }
  return [
    { url: base, lastModified: now },
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: now,
    })),
  ];
}
