"use client";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <h1 className="text-2xl font-bold text-white">Couldn&apos;t load your orders</h1>
      <p className="mt-2 text-zinc-400">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-accent px-8 font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
