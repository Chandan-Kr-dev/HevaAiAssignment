import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { OrdersList } from "@/components/OrdersList";

export const metadata: Metadata = {
  title: "Your orders",
};

export default function OrdersPage() {
  return (
    <RequireAuth>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your orders</h1>
      <OrdersList />
    </RequireAuth>
  );
}
