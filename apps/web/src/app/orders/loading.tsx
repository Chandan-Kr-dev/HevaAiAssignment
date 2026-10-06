export default function OrdersLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-9 w-52 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/10" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </ul>
    </div>
  );
}
