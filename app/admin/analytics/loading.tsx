import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="border-b">
        <div className="flex gap-1 -mb-px">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-28" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
