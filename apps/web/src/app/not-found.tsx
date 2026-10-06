import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-accent px-8 font-medium text-white"
      >
        Back to the store
      </Link>
    </div>
  );
}
