"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { Badge } from "./ui/Badge";
import { ConfettiBurst } from "./ui/ConfettiBurst";
import { HoverBorderGradient } from "./ui/HoverBorderGradient";
import { ShimmeringText } from "./ui/ShimmeringText";
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
      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Please sign in</h1>
        <div className="mt-6 flex justify-center">
          <HoverBorderGradient
            as="a"
            href="/api/auth/google"
            containerClassName="min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            className="flex min-h-[42px] items-center bg-accent"
          >
            Sign in with Google
          </HoverBorderGradient>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Order status</h1>
        <p className="mt-2 text-zinc-400">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        aria-label="Loading order"
        className="mx-auto mt-8 h-64 max-w-xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
      />
    );
  }

  return (
    <div className="relative mx-auto mt-8 max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_-45px_rgba(124,58,237,0.9)] backdrop-blur-xl">
      {celebrate ? <ConfettiBurst /> : null}
      {/* Hairline + bloom: the status card should read as the lit centerpiece. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-44 w-56 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-3">
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
      <StatusStepper status={order.status} />
      {order.status === "PAID" ? (
        <p className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200 ring-1 ring-inset ring-emerald-300/20">
          Payment confirmed. Confirmation email on its way.
        </p>
      ) : null}
      {order.status === "FAILED" ? (
        <p className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200 ring-1 ring-inset ring-red-300/20">
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
        <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200 ring-1 ring-inset ring-amber-300/20">
          <ShimmeringText
            text="Still waiting for payment confirmation. You can leave this page; we'll email you."
            color="#fcd34d"
            shimmeringColor="#fef3c7"
          />
        </p>
      ) : null}
    </div>
  );
}

type StepState = "done" | "active" | "failed" | "idle";

const DOT: Record<StepState, string> = {
  done: "bg-emerald-400 text-emerald-950 shadow-[0_0_12px_rgba(52,211,153,0.7)]",
  active: "bg-amber-400 text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.7)]",
  failed: "bg-red-400 text-red-950 shadow-[0_0_12px_rgba(248,113,113,0.7)]",
  idle: "bg-white/15 text-zinc-400",
};

const LABEL: Record<StepState, string> = {
  done: "text-zinc-200",
  active: "text-amber-200",
  failed: "text-red-200",
  idle: "text-zinc-500",
};

const MARK: Record<StepState, string> = {
  done: "\u2713",
  active: "",
  failed: "\u2715",
  idle: "",
};

// Purely presentational rail: mirrors the status the API already reported
// (never infers a state of its own). PENDING lights only the "Payment" step,
// PAID completes the email step too, FAILED stops the rail at payment.
function StatusStepper({ status }: { status: Order["status"] }) {
  const steps: { label: string; state: StepState }[] = [
    { label: "Order placed", state: "done" },
    {
      label: "Payment",
      state:
        status === "PAID" ? "done" : status === "FAILED" ? "failed" : "active",
    },
    {
      label: "Confirmation email",
      state: status === "PAID" ? "done" : "idle",
    },
  ];

  return (
    <ol
      aria-label="Order progress"
      className="mt-6 flex items-center gap-1 text-[11px] font-medium sm:text-xs"
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.label} className="flex min-w-0 flex-1 items-center">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${DOT[step.state]}`}
              >
                {MARK[step.state]}
              </span>
              <span className={`truncate ${LABEL[step.state]}`}>
                {step.label}
              </span>
            </span>
            {last ? null : (
              <span
                aria-hidden="true"
                className={`mx-2 h-px min-w-3 flex-1 ${
                  step.state === "done" ? "bg-emerald-400/50" : "bg-white/10"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
