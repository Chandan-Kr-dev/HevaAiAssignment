// Slug -> 3D model mapping. Put .glb files in apps/web/public/models/
// named <slug>.glb (served statically at /models/<slug>.glb, never bundled).
// A slug missing here simply gets no 3D view (poster image only).
export const PRODUCT_MODELS: Record<string, { src: string; alt: string }> = {
  "apple-iphone-16": {
    src: "/models/apple-iphone-16.glb",
    alt: "3D view of Apple iPhone 16",
  },
  "samsung-galaxy-s25": {
    src: "/models/samsung-galaxy-s25.glb",
    alt: "3D view of Samsung Galaxy S25",
  },
  "google-pixel-9": {
    src: "/models/google-pixel-9.glb",
    alt: "3D view of Google Pixel 9",
  },
  "oneplus-13": {
    src: "/models/oneplus-13.glb",
    alt: "3D view of OnePlus 13",
  },
  "nothing-phone-3": {
    src: "/models/nothing-phone-3.glb",
    alt: "3D view of Nothing Phone (3)",
  },
  "xiaomi-15": {
    src: "/models/xiaomi-15.glb",
    alt: "3D view of Xiaomi 15",
  },
};

export function getProductModel(
  slug: string,
): { src: string; alt: string } | undefined {
  return PRODUCT_MODELS[slug];
}

export function hasProductModel(slug: string): boolean {
  return slug in PRODUCT_MODELS;
}
