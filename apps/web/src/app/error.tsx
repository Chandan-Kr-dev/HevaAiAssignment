"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-400/10 text-xl ring-1 ring-inset ring-red-400/25"
      >
        !
      </span>
      <h1 className="mt-4 text-3xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-zinc-400">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-b from-violet-400 via-accent to-violet-700 px-8 font-semibold text-white ring-1 ring-inset ring-white/20 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        Try again
      </button>
    </div>
  );
}
