// Public shape of a product. Only storefront-safe fields: no timestamps,
// no relations, money stays integer paise (never floats).
export class ProductDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string;
  pricePaise!: number;
  imageUrl!: string;
}
