export function BoardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="cork-board grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-xl border border-[var(--manila-dark)]/20 bg-[var(--paper-bright)] p-4 shadow-sm animate-pulse"
        >
          <div className="aspect-[4/3] w-full rounded-lg bg-[var(--manila)]/20" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-1/3 rounded bg-[var(--manila)]/30" />
            <div className="h-6 w-3/4 rounded bg-[var(--manila)]/40" />
            <div className="h-4 w-1/2 rounded bg-[var(--manila)]/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
