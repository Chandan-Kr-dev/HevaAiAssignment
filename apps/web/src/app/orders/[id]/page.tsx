import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { OrderStatus } from "@/components/OrderStatus";

export const metadata: Metadata = {
  title: "Order status",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireAuth>
      <OrderStatus orderId={id} />
    </RequireAuth>
  );
}
