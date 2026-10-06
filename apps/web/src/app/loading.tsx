export default function Loading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-zinc-200" />
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            <div className="aspect-square w-full animate-pulse bg-zinc-200" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
              <div className="h-5 w-1/4 animate-pulse rounded bg-zinc-200" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
