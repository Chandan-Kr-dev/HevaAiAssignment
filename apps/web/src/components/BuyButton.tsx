"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatedButton } from "./ui/AnimatedButton";
import { HoverBorderGradient } from "./ui/HoverBorderGradient";
import { useAuth } from "./AuthProvider";
import { ApiError, apiFetch } from "@/lib/client-api";
import type { CreateOrderResponse } from "@/lib/types";

// Minimal Razorpay Checkout typing: the script tag injects a constructor on
// window. Kept structural (not `any`) so eslint stays clean; the surface is
// intentionally tiny (open a modal, then navigate; nothing else).
type RazorpayCheckout = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

export function BuyButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        aria-label="Loading buy button"
        className="mt-6 h-12 w-44 animate-pulse rounded-full bg-white/10"
      />
    );
  }

  if (!user) {
    return (
      <HoverBorderGradient
        as="a"
        href="/api/auth/google"
        containerClassName="mt-6 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        className="flex min-h-[42px] items-center bg-accent"
      >
        Sign in to buy
      </HoverBorderGradient>
    );
  }

  const buy = async () => {
    setBusy(true);
    setError(null);
    try {
      const order = await apiFetch<CreateOrderResponse>("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Heva Store",
        description: productName,
        // The handler ONLY navigates. Payment state changes exclusively via
        // the signature-verified Razorpay webhook: the webhook is the only
        // source of truth, never this browser callback.
        handler: () => router.push(`/orders/${order.orderId}`),
        modal: { ondismiss: () => router.push(`/orders/${order.orderId}`) },
      });
      checkout.open();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start checkout. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {/* Same onClick/disabled/loading contract; only the visual is new. */}
      <AnimatedButton
        disabled={busy}
        onClick={() => void buy()}
        className="min-h-[48px] px-8 shadow-[0_0_32px_-8px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        {busy ? "Starting checkout…" : "Buy now"}
      </AnimatedButton>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
