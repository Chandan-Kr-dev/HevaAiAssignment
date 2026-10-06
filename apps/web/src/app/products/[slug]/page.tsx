import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackgroundBeams } from "@/components/ui/BackgroundBeams";
import { BuyButton } from "@/components/BuyButton";
import { ProductMedia } from "@/components/ProductMedia";
import { ShinyText } from "@/components/ui/ShinyText";
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

const TRUST = [
  {
    label: "Google sign-in",
    path: "M12 2a10 10 0 1 0 9.5 13.3M12 2a10 10 0 0 1 9.5 13.3M12 2v10",
  },
  {
    label: "Razorpay secure checkout",
    path: "M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 22.3 5 18.4 5 14V6l7-3z",
  },
  {
    label: "Confirmation email",
    path: "M4 6h16v12H4zM4 7l8 6 8-6",
  },
];

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
    <div className="relative">
      {/* Aceternity beams drift behind the buy panel, masked to a soft
          ellipse so they never touch the text contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] overflow-hidden [mask-image:radial-gradient(ellipse_60%_60%_at_60%_30%,black,transparent_75%)]"
      >
        <BackgroundBeams />
      </div>

      <div className="relative grid gap-8 md:grid-cols-2">
        {/* Client island for the optional 3D viewer; the page stays a server
            component and the poster image below is server-rendered. */}
        <ProductMedia
          imageUrl={product.imageUrl}
          name={product.name}
          modelSrc={model?.src}
          modelAlt={model?.alt}
        />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            <span aria-hidden="true">←</span> All phones
          </Link>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-bold">
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">
              {formatINR(product.pricePaise)}
            </span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            <ShinyText
              text="Price inclusive of all taxes · Free shipping"
              color="#71717a"
              shineColor="#c4b5fd"
              speed={4}
            />
          </p>
          <p className="mt-4 leading-7 text-zinc-400">{product.description}</p>

          {/* Client island: the page itself stays a server component. */}
          <BuyButton productId={product.id} productName={product.name} />

          <ul className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-xs text-zinc-400">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-400/10 ring-1 ring-inset ring-violet-400/25"
                >
                  <svg
                    className="h-4 w-4 text-violet-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.path} />
                  </svg>
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </div>
    </div>
  );
}
