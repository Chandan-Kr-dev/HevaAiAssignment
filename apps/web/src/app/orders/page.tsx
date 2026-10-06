import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "Your orders",
};

export default function OrdersPage() {
  return (
    <RequireAuth>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your orders</h1>
      <p className="text-zinc-600">Your order history will appear here.</p>
    </RequireAuth>
  );
}
