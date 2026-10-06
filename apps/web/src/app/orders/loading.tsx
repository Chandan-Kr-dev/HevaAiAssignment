export default function OrdersLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-white/10" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </ul>
    </div>
  );
}
