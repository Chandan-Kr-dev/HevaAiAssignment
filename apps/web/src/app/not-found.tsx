import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-b from-violet-400 via-accent to-violet-700 px-8 font-semibold text-white ring-1 ring-inset ring-white/20 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        Back to the store
      </Link>
    </div>
  );
}
