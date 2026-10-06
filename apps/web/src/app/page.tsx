import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/api";
import { formatINR } from "@/lib/format";

// Revalidate every 60s: prices/catalog change rarely, so static pages stay
// fast while edits show up within a minute.
export const revalidate = 60;

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Handpicked for you
      </h1>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <li
            key={product.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            <Link href={`/products/${product.slug}`}>
              <div className="aspect-square w-full overflow-hidden bg-zinc-100">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={800}
                  height={800}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full"
                  priority={index === 0}
                />
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{product.name}</h2>
                <p className="mt-1 text-zinc-700">
                  {formatINR(product.pricePaise)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
