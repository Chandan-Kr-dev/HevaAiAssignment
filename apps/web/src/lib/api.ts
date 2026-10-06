import type { Product } from "./types";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

// Server-side only: fetches straight from NestJS. No caching tricks here;
// callers pass Next's fetch options (e.g. revalidate) per page instead.
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to load products: ${res.status}`);
  }
  return (await res.json()) as Product[];
}

// Null on 404 so the detail page can call notFound().
export async function getProduct(slug: string): Promise<Product | null> {
  const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load product ${slug}: ${res.status}`);
  }
  return (await res.json()) as Product;
}
