import type { OrderStatus } from '@prisma/client';

// Public shape of an order. Never includes razorpayOrderId or
// confirmationEmailSentAt: those are provider/ops internals.
export type OrderProductDto = {
  name: string;
  slug: string;
  imageUrl: string;
};

export type OrderDto = {
  id: string;
  status: OrderStatus;
  amountPaise: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  product: OrderProductDto;
};

// Returned once at checkout so the frontend can open Razorpay Checkout.
export type CreateOrderResponse = {
  orderId: string;
  razorpayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
};
