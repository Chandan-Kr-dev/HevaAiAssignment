import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { formatINR } from "@/lib/format";

// Always fresh: stock and price must never be served stale on a buy page.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

function canonicalPath(slug: string): string {
  return `/products/${slug}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: canonicalPath(product.slug) },
    openGraph: {
      title: product.name,
      description,
      images: [product.imageUrl],
      type: "website",
      url: canonicalPath(product.slug),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    notFound();
  }

  const priceRupees = (product.pricePaise / 100).toFixed(2);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: priceRupees,
      availability: "https://schema.org/InStock",
      url: canonicalPath(product.slug),
    },
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={800}
          height={800}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-auto w-full"
          priority
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-2xl text-zinc-800">
          {formatINR(product.pricePaise)}
        </p>
        <p className="mt-4 leading-7 text-zinc-600">{product.description}</p>
        {/* Checkout arrives later; the button stays inert until then. */}
        <button
          type="button"
          disabled
          className="mt-6 cursor-not-allowed rounded-full bg-zinc-300 px-8 py-3 font-medium text-zinc-500"
        >
          Buy now
        </button>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
