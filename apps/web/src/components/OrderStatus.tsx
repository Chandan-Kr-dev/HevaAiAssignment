"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { Badge } from "./ui/Badge";
import { ConfettiBurst } from "./ui/ConfettiBurst";
import { ApiError, apiFetch } from "@/lib/client-api";
import { formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;
// ~3 minutes of PENDING polling, then stop hammering and let email take over.
const MAX_POLLS = 72;

export function OrderStatus({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const inFlight = useRef(false);
  const prevStatus = useRef<Order["status"] | null>(null);

  useEffect(() => {
    // Skip until auth resolves; RequireAuth guarantees a user past loading.
    if (authLoading || !user) {
      return;
    }
    let cancelled = false;
    let polls = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async (): Promise<boolean> => {
      // No overlapping requests: a slow response never piles up behind the timer.
      if (inFlight.current) {
        return true;
      }
      inFlight.current = true;
      try {
        const fresh = await apiFetch<Order>(`/orders/${orderId}`);
        if (cancelled) {
          return false;
        }
        setOrder(fresh);
        setError(null);
        return fresh.status === "PENDING";
      } catch (err) {
        if (cancelled) {
          return false;
        }
        // 401/404 are terminal for this view; network blips keep polling.
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 404)
        ) {
          setError(
            err.status === 401 ? "signed-out" : "Order not found.",
          );
          return false;
        }
        setError("Connection lost. Retrying…");
        return true;
      } finally {
        inFlight.current = false;
      }
    };

    void load().then((keepGoing) => {
      if (cancelled || !keepGoing) {
        return;
      }
      timer = setInterval(() => {
        polls += 1;
        if (polls >= MAX_POLLS) {
          if (timer) {
            clearInterval(timer);
          }
          setTimedOut(true);
          return;
        }
        void load().then((more) => {
          if (!more && timer) {
            clearInterval(timer);
          }
        });
      }, POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [authLoading, user, orderId]);

  // Celebration is purely presentational: when polling observes the
  // PENDING -> PAID flip, arm a one-shot confetti burst. No API calls,
  // deferred to a frame callback, skipped entirely under reduced motion.
  useEffect(() => {
    const status = order?.status ?? null;
    const transitioned = status === "PAID" && prevStatus.current === "PENDING";
    prevStatus.current = status;
    if (!transitioned) {
      return;
    }
    const frame = requestAnimationFrame(() => setCelebrate(true));
    return () => cancelAnimationFrame(frame);
  }, [order]);

  if (error === "signed-out") {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Please sign in</h1>
        <a
          href="/api/auth/google"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-accent px-6 font-medium text-white"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Order status</h1>
        <p className="mt-2 text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        aria-label="Loading order"
        className="mx-auto mt-8 h-48 max-w-xl animate-pulse rounded-2xl bg-white/10"
      />
    );
  }

  return (
    <div className="relative mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      {celebrate ? <ConfettiBurst /> : null}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white">Order status</h1>
        <Badge
          tone={
            order.status === "PAID"
              ? "paid"
              : order.status === "FAILED"
                ? "failed"
                : "pending"
          }
        >
          {order.status === "PAID" ? "✓ " : ""}
          {order.status}
        </Badge>
      </div>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Product</dt>
          <dd className="min-w-0 truncate text-zinc-100">
            <Link
              href={`/products/${order.product.slug}`}
              className="rounded underline decoration-zinc-600 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              {order.product.name}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Amount</dt>
          <dd className="text-zinc-100">{formatINR(order.amountPaise)}</dd>
        </div>
      </dl>
      {order.status === "PAID" ? (
        <p className="mt-4 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">
          Payment confirmed. Confirmation email on its way.
        </p>
      ) : null}
      {order.status === "FAILED" ? (
        <p className="mt-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-200">
          Payment failed.{" "}
          <Link
            href={`/products/${order.product.slug}`}
            aria-label={`Try ${order.product.name} again`}
            className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Try again
          </Link>
          .
        </p>
      ) : null}
      {timedOut && order.status === "PENDING" ? (
        <p className="mt-4 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-200">
          Still waiting for payment confirmation. You can leave this page;
          we&apos;ll email you.
        </p>
      ) : null}
    </div>
  );
}
