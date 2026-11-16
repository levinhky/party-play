const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function GameGridSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Đang tải danh sách trò chơi"
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-36 animate-pulse rounded-lg bg-blue-100" />
          <div className="h-4 w-28 animate-pulse rounded-md bg-slate-100" />
        </div>
        <div className="hidden h-9 w-36 animate-pulse rounded-full bg-blue-50 sm:block" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skeletonCards.map((card) => (
          <div
            key={card}
            className="min-h-56 animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="h-[68px] w-[68px] rounded-2xl bg-blue-100" />
              <div className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
            <div className="mt-5 h-5 w-2/3 rounded-md bg-slate-100" />
            <div className="mt-3 h-3.5 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3.5 w-4/5 rounded bg-slate-100" />
            <div className="mt-6 flex gap-4 border-t border-slate-100 pt-4">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
