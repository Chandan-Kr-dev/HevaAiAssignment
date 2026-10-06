import Image from "next/image";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { Badge } from "@/components/ui/Badge";
import { BlurText } from "@/components/ui/BlurText";
import { CountUp } from "@/components/ui/CountUp";
import { GlareHover } from "@/components/ui/GlareHover";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { ShinyText } from "@/components/ui/ShinyText";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StarBorder } from "@/components/ui/StarBorder";
import { Tilt } from "@/components/ui/Tilt";
import { getProducts } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { hasProductModel } from "@/lib/models";

// Revalidate every 60s: prices/catalog change rarely, so static pages stay
// fast while edits show up within a minute.
export const revalidate = 60;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300";

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      {/* Hero: the H1 is plain server text (never hidden) so LCP/SEO stay
          intact; the React-Bits blur animation runs on the subcopy only.
          Aurora wash is Aceternity, decorative and pointer-inert. */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] px-4 pb-12 pt-14 text-center">
        <AuroraBackground />
        <div className="relative">
          <Badge tone="info">New season drop</Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-5xl font-extrabold tracking-tight text-white md:text-7xl">
            Flagships,{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent">
              zero noise.
            </span>
          </h1>
          <BlurText
            text="Six phones worth your money. Honest prices, no clutter, checkout in seconds."
            animateByWords
            delay={110}
            className="mx-auto mt-5 max-w-xl justify-center text-lg text-zinc-400"
          />

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {/* React-Bits StarBorder inside Animate UI Magnetic: the streak
                sweeps the pill edge while the whole pill drifts toward the
                cursor (inert on touch / reduced motion). */}
            <Magnetic>
              <StarBorder
                as="a"
                href="#catalog"
                className={`${FOCUS_RING} rounded-[20px]`}
                innerClassName="font-semibold transition-transform duration-300 hover:scale-[1.03]"
                backgroundColor="linear-gradient(to bottom, #a78bfa, #7c3aed, #5b21b6)"
                borderColor="rgba(255,255,255,0.25)"
                color="rgba(233,213,255,0.95)"
              >
                Browse the collection
              </StarBorder>
            </Magnetic>
            <Link
              href="/orders"
              className={`inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-400/50 hover:text-white ${FOCUS_RING}`}
            >
              Track an order
            </Link>
          </div>

          {/* Stats: the count is real data (catalog size), the rest restates
              promises already made on the store. */}
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <dt className="sr-only">Flagships in the catalog</dt>
              <dd>
                <span className="text-3xl font-bold text-white">
                  <CountUp to={products.length} duration={1.4} />
                </span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Handpicked flagships
                </span>
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <dt className="sr-only">Payment security</dt>
              <dd>
                <span className="text-3xl font-bold text-white">100%</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Secure Razorpay checkout
                </span>
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <dt className="sr-only">Shipping cost</dt>
              <dd>
                <span className="text-3xl font-bold text-white">Free</span>
                <span className="mt-1 block text-sm text-zinc-400">
                  Shipping across India
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="catalog" className="scroll-mt-24">
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.id}>
              <Reveal className="h-full" delay={(index % 3) * 0.07}>
                {/* Animate UI Tilt on the outside, Aceternity spotlight on
                    the card face, React-Bits glare across the photo. */}
                <Tilt maxTilt={5} perspective={900} className="h-full">
                  <SpotlightCard className="h-full border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-violet-400/40 hover:shadow-[0_24px_60px_-32px_rgba(124,58,237,0.9)]">
                    <Link
                      href={`/products/${product.slug}`}
                      className={`group flex h-full flex-col rounded-2xl ${FOCUS_RING}`}
                    >
                      <GlareHover
                        className="aspect-square w-full bg-white/5"
                        style={{ borderRadius: 0 }}
                        glareColor="#c4b5fd"
                        glareOpacity={0.3}
                      >
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={800}
                          height={800}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                          priority={index === 0}
                        />
                      </GlareHover>
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="truncate font-semibold text-zinc-100 transition-colors group-hover:text-white">
                          {product.name}
                        </h2>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <p className="text-lg font-semibold text-white">
                            {formatINR(product.pricePaise)}
                          </p>
                          {hasProductModel(product.slug) ? (
                            <span className="shrink-0 rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-200 ring-1 ring-inset ring-violet-300/30">
                              3D
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </SpotlightCard>
                </Tilt>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <Reveal className="mt-12 text-center text-sm text-zinc-500">
        <ShinyText
          text="Prices include all taxes. Free shipping across India."
          color="#71717a"
          shineColor="#c4b5fd"
          speed={3}
        />
      </Reveal>
    </div>
  );
}
