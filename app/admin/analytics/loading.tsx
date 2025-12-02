import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for analytics page
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-1 -mb-px">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-28" />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Metrics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40 mt-2" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
