"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "./ui/Badge";
import { apiFetch } from "@/lib/client-api";
import { formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Failed to load orders";
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await apiFetch<Order[]>("/orders"));
    } catch (err) {
      setError(toMessage(err));
    }
  }, []);

  useEffect(() => {
    // Async continuations only (never synchronous setState): late responses
    // after unmount are dropped instead of cascading renders.
    let cancelled = false;
    apiFetch<Order[]>("/orders").then(
      (rows) => {
        if (!cancelled) {
          setOrders(rows);
        }
      },
      (err: unknown) => {
        if (!cancelled) {
          setError(toMessage(err));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-accent px-6 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orders) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </ul>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-zinc-400">No orders yet.</p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-accent px-6 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30"
        >
          <Link href={`/orders/${order.id}`} className="flex min-w-0 items-center justify-between gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-100">{order.product.name}</p>
              <p className="text-sm text-zinc-400">
                {formatINR(order.amountPaise)} · {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge
              tone={
                order.status === "PAID"
                  ? "paid"
                  : order.status === "FAILED"
                    ? "failed"
                    : "pending"
              }
              className="shrink-0"
            >
              {order.status}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
