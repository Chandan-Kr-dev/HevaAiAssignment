import type { Product } from "./types";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const REQUEST_TIMEOUT_MS = 15000;
const BUILD_RETRY_ATTEMPTS = 4;
const BUILD_RETRY_WAIT_MS = 10000;

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Server-side only: fetches straight from NestJS. No caching tricks here;
// callers pass Next's fetch options (e.g. revalidate) per page instead.
export async function getProducts(): Promise<Product[]> {
  // During `next build` the API (often on a free host) may still be waking
  // up: retry a few times before giving up, so deploys don't fail on a slow
  // backend. At runtime errors still propagate to error.tsx.
  const attempts = isProductionBuild() ? BUILD_RETRY_ATTEMPTS : 1;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`Failed to load products: ${res.status}`);
      }
      return (await res.json()) as Product[];
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(BUILD_RETRY_WAIT_MS);
      }
    }
  }
  if (isProductionBuild()) {
    // Degrade instead of failing the deploy: an empty catalog page builds
    // fine and revalidates to real data within a minute of traffic.
    const message = lastError instanceof Error ? lastError.message : "unknown error";
    console.warn(
      `getProducts: all ${BUILD_RETRY_ATTEMPTS} build-time attempts failed for ${API_BASE_URL}/products: ${message}. Building with an empty catalog.`,
    );
    return [];
  }
  throw lastError;
}

// Null on 404 so the detail page can call notFound().
export async function getProduct(slug: string): Promise<Product | null> {
  // Product pages render per request (force-dynamic), so build-time leniency
  // does not apply here: failures throw as usual.
  const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load product ${slug}: ${res.status}`);
  }
  return (await res.json()) as Product;
}
