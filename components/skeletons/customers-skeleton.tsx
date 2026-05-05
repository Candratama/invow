import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton mirrors the real /dashboard/customers layout so the swap to
 * data is layout-shift free:
 *  - PageHeader (h-16) with title + Add button
 *  - Search bar row
 *  - Status filter row (3 buttons grid)
 *  - Customer list cards inside max-w-4xl container
 */
export function CustomersSkeleton() {
  return (
    <div className="flex flex-col">
      {/* PageHeader skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>

      {/* Search bar row */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Status filter row */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Customer list */}
      <div className="max-w-4xl mx-auto w-full px-4 lg:px-6 py-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
