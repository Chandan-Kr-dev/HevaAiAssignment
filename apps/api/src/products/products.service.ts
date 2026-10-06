import { Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductDto } from './dto/product.dto.js';

// Pick only storefront-safe fields so DB internals never leak to clients.
function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    pricePaise: product.pricePaise,
    imageUrl: product.imageUrl,
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return products.map(toProductDto);
  }

  async findBySlug(slug: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (!product) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }
    return toProductDto(product);
  }
}
