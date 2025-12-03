import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="pb-24 px-4 lg:px-6 lg:pb-8">
      <div className="max-w-md lg:max-w-2xl mx-auto pt-8">
        {/* Welcome text skeleton */}
        <div className="text-left mb-8 lg:mb-12 lg:text-center">
          <Skeleton className="h-6 w-48 lg:mx-auto" />
        </div>

        {/* Revenue cards skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        {/* Invoices list skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:p-8">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
