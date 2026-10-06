import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
};

// Slugs are reused from the original catalog so existing product IDs (and any
// orders pointing at them) stay valid; only the catalog data is replaced.
const PRODUCTS: SeedProduct[] = [
  {
    slug: 'handloom-cotton-kurta',
    name: 'Apple iPhone 16',
    description:
      'Apple iPhone 16 with A18 chip, 48MP Fusion camera, and 6.1-inch Super Retina XDR display.',
    pricePaise: 7990000,
    imageUrl:
      'https://images.unsplash.com/photo-1758186378952-68ac2d1c8d39?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    slug: 'brass-diya-set-of-4',
    name: 'Samsung Galaxy S25',
    description:
      'Samsung Galaxy S25 flagship smartphone with a 6.2-inch Dynamic AMOLED 2X display and advanced Galaxy AI features.',
    pricePaise: 8099900,
    imageUrl:
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'ceramic-chai-kulhad-set',
    name: 'Google Pixel 9',
    description:
      'Google Pixel 9 with Tensor G4, advanced Pixel AI features, and a professional-grade dual camera system.',
    pricePaise: 7999900,
    imageUrl:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'mysore-sandal-soap-trio',
    name: 'OnePlus 13',
    description:
      'OnePlus 13 flagship smartphone featuring Snapdragon performance, a high-refresh-rate AMOLED display, and Hasselblad cameras.',
    pricePaise: 6999900,
    imageUrl:
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'block-print-bedsheet',
    name: 'Nothing Phone (3)',
    description:
      'Nothing Phone (3) with a distinctive transparent-inspired design, high-performance hardware, and a modern AMOLED display.',
    pricePaise: 5999900,
    imageUrl:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'south-indian-filter-coffee-maker',
    name: 'Xiaomi 15',
    description:
      'Xiaomi 15 flagship smartphone with a compact AMOLED display, Snapdragon performance, and Leica-powered camera technology.',
    pricePaise: 6499900,
    imageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  },
];

async function main(): Promise<void> {
  // Upserts by slug keep the seed idempotent: safe to run any number of times.
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        pricePaise: product.pricePaise,
        imageUrl: product.imageUrl,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        pricePaise: product.pricePaise,
        imageUrl: product.imageUrl,
      },
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
