import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Order, Product } from '@prisma/client';
import { PaymentProvider } from '../payments/payment-provider.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderResponse, OrderDto } from './order.dto.js';

type OrderWithProduct = Order & {
  product: Pick<Product, 'name' | 'slug' | 'imageUrl'>;
};

// Strip provider/ops internals before anything leaves the API.
function toOrderDto(order: OrderWithProduct): OrderDto {
  return {
    id: order.id,
    status: order.status,
    amountPaise: order.amountPaise,
    currency: order.currency,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    product: {
      name: order.product.name,
      slug: order.product.slug,
      imageUrl: order.product.imageUrl,
    },
  };
}

const PRODUCT_SELECT = {
  name: true,
  slug: true,
  imageUrl: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentProvider,
    private readonly config: ConfigService,
  ) {}

  async create(
    userId: string,
    productId: string,
  ): Promise<CreateOrderResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }
    // Price comes ONLY from the DB row; client-sent amounts are ignored.
    // PENDING is committed first so a provider outage still leaves an
    // auditable order row instead of a silent failure.
    const order = await this.prisma.order.create({
      data: {
        userId,
        productId: product.id,
        amountPaise: product.pricePaise,
        currency: 'INR',
        status: 'PENDING',
      },
    });
    let razorpayOrderId: string;
    try {
      const result = await this.payments.createOrder({
        amountPaise: product.pricePaise,
        currency: 'INR',
        receipt: order.id,
      });
      razorpayOrderId = result.providerOrderId;
    } catch {
      // Generic message on purpose: provider internals must never leak.
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      throw new BadGatewayException(
        'Payment provider is unavailable, please try again',
      );
    }
    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId },
    });
    return {
      orderId: order.id,
      razorpayOrderId,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID') ?? '',
      amountPaise: product.pricePaise,
      currency: 'INR',
    };
  }

  async findAllForUser(userId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: PRODUCT_SELECT } },
    });
    return orders.map(toOrderDto);
  }

  async findByIdForUser(userId: string, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { product: { select: PRODUCT_SELECT } },
    });
    // 404 (not 403) so callers cannot probe other users' order ids.
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }
    return toOrderDto(order);
  }
}
