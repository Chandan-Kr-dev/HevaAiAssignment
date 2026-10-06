import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { OrdersList } from "@/components/OrdersList";

export const metadata: Metadata = {
  title: "Your orders",
};

export default function OrdersPage() {
  return (
    <RequireAuth>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Your{" "}
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            orders
          </span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every order, from pending to paid, in one place.
        </p>
      </div>
      <OrdersList />
    </RequireAuth>
  );
}
