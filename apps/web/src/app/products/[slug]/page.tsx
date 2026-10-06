import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { ProductMedia } from "@/components/ProductMedia";
import { getProduct } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { getProductModel } from "@/lib/models";

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
  const model = getProductModel(product.slug);
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
      {/* Client island for the optional 3D viewer; the page stays a server
          component and the poster image below is server-rendered. */}
      <ProductMedia
        imageUrl={product.imageUrl}
        name={product.name}
        modelSrc={model?.src}
        modelAlt={model?.alt}
      />
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">{product.name}</h1>
        <p className="mt-2 text-2xl font-semibold text-violet-300">
          {formatINR(product.pricePaise)}
        </p>
        <p className="mt-4 leading-7 text-zinc-400">{product.description}</p>
        {/* Client island: the page itself stays a server component. */}
        <BuyButton productId={product.id} productName={product.name} />
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
