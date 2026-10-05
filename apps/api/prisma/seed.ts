import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: 'handloom-cotton-kurta',
    name: 'Handloom Cotton Kurta',
    description:
      'Handwoven by artisan clusters in West Bengal from breathable long-staple cotton. A relaxed everyday fit with mother-of-pearl buttons and side slits for ease of movement.',
    pricePaise: 129900,
  },
  {
    slug: 'brass-diya-set-of-4',
    name: 'Brass Diya Set of 4',
    description:
      'Cast in Moradabad from solid brass with a hand-hammered finish that glows when lit. Each set of four arrives gift-boxed with cotton wicks, ready for Diwali or daily aarti.',
    pricePaise: 74900,
  },
  {
    slug: 'ceramic-chai-kulhad-set',
    name: 'Ceramic Chai Kulhad Set of 6',
    description:
      'Unglazed earthen-style ceramic kulhads that lend cutting chai its signature earthy aroma. Dishwasher-safe and chip-resistant, they bring the tapri experience to your kitchen shelf.',
    pricePaise: 59900,
  },
  {
    slug: 'mysore-sandal-soap-trio',
    name: 'Mysore Sandal Soap Trio',
    description:
      'Three 150g bars milled with pure Mysore sandalwood oil for a creamy, long-lasting lather. The classic woody fragrance lingers on skin without overpowering the senses.',
    pricePaise: 49900,
  },
  {
    slug: 'block-print-bedsheet',
    name: 'Jaipur Block-Print King Bedsheet',
    description:
      'Hand block-printed in Sanganer with natural dyes on 200TC combed cotton. Includes two matching pillow covers, and the colours soften beautifully with every wash.',
    pricePaise: 199900,
  },
  {
    slug: 'south-indian-filter-coffee-maker',
    name: 'South Indian Filter Coffee Maker',
    description:
      'Traditional stainless-steel dabara set with a slow-drip upper chamber for strong decoction. Brews two tumblers of frothy kaapi in minutes and cleans up with a quick rinse.',
    pricePaise: 249900,
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
        imageUrl: `https://picsum.photos/seed/${product.slug}/800/800`,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        pricePaise: product.pricePaise,
        imageUrl: `https://picsum.photos/seed/${product.slug}/800/800`,
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
