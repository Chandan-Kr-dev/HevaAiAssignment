import Image from "next/image";
import Link from "next/link";
import { BlurText } from "@/components/ui/BlurText";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { getProducts } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { hasProductModel } from "@/lib/models";

// Revalidate every 60s: prices/catalog change rarely, so static pages stay
// fast while edits show up within a minute.
export const revalidate = 60;

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      {/* Hero: the H1 is plain server text (never hidden) so LCP/SEO stay
          intact; the React-Bits blur animation runs on the subcopy only. */}
      <section className="mb-10 mt-4 text-center">
        <Badge tone="info">New season drop</Badge>
        <h1 className="mx-auto mt-4 max-w-3xl text-balance text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          Flagships,{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            zero noise.
          </span>
        </h1>
        <BlurText
          text="Six phones worth your money. Honest prices, no clutter, checkout in seconds."
          className="mx-auto mt-4 max-w-xl justify-center text-lg text-zinc-400"
        />
      </section>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <li key={product.id}>
            <SpotlightCard className="border border-white/10 bg-white/[0.03] transition-colors">
              <Link
                href={`/products/${product.slug}`}
                className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <div className="aspect-square w-full overflow-hidden bg-white/5">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={800}
                    height={800}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    priority={index === 0}
                  />
                </div>
                <div className="p-4">
                  <h2 className="truncate font-semibold text-zinc-100">
                    {product.name}
                  </h2>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-white">
                      {formatINR(product.pricePaise)}
                    </p>
                  {hasProductModel(product.slug) ? (
                    <span className="shrink-0 rounded-full bg-violet-400/15 px-2.5 py-0.5 text-xs font-medium text-violet-200">
                      3D
                    </span>
                  ) : null}
                </div>
              </div>
              </Link>
            </SpotlightCard>
          </li>
        ))}
      </ul>
      <Reveal className="mt-12 text-center text-sm text-zinc-500">
        Prices include all taxes. Free shipping across India.
      </Reveal>
    </div>
  );
}
