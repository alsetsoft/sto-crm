import { Skeleton } from "@/components/ui/skeleton";

// Streamed instantly on navigation to /sklad while the server fetches the
// (force-dynamic) warehouse data, so the route never appears to hang.
export default function Loading() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 min-w-[240px] flex-1" />
          <Skeleton className="h-10 w-[240px]" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card p-3 shadow-card">
          <Skeleton className="mb-3 h-9 w-full" />
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
