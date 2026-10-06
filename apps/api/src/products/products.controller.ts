import { Controller, Get, Param } from '@nestjs/common';
import type { ProductDto } from './dto/product.dto.js';
import { ProductsService } from './products.service.js';

// Public storefront endpoints: no auth, read-only, no client input is persisted.
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(): Promise<ProductDto[]> {
    return this.products.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<ProductDto> {
    return this.products.findBySlug(slug);
  }
}
