export default function Loading() {
  return (
    <div>
      {/* Hero skeleton mirrors the real hero card (badge, H1, CTA row). */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-4 pb-12 pt-14">
        <div className="mx-auto h-7 w-36 animate-pulse rounded-full bg-white/10" />
        <div className="mx-auto mt-5 h-14 w-3/4 animate-pulse rounded-xl bg-white/10" />
        <div className="mx-auto mt-4 h-5 w-1/2 animate-pulse rounded-lg bg-white/10" />
        <div className="mx-auto mt-9 h-12 w-72 animate-pulse rounded-full bg-white/10" />
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
          >
            <div className="aspect-square w-full animate-pulse bg-white/10" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-1/4 animate-pulse rounded bg-white/10" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
