export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
};

// Shape of GET /auth/me. Mirrors the API's CurrentUserData; kept in sync
// by hand since the frontend never validates auth payloads itself.
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type OrderStatus = "PENDING" | "PAID" | "FAILED";

// Shape of GET /orders and GET /orders/:id. A display subset: the API never
// sends provider internals (razorpay ids) or ops fields to the browser.
export type Order = {
  id: string;
  status: OrderStatus;
  amountPaise: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  product: { name: string; slug: string; imageUrl: string };
};

// Shape of POST /orders: everything Razorpay Checkout needs, nothing more.
export type CreateOrderResponse = {
  orderId: string;
  razorpayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
};
