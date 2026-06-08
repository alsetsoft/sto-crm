import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder matching the warehouse create/edit form layout. */
export function WarehouseFormSkeleton() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-7 w-56" />
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="col-span-2 flex flex-col gap-1.5 md:col-span-2"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </main>
  );
}
