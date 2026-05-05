import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the real /dashboard layout (max-w-4xl, welcome text, financial
 * cards 2-up on desktop / horizontal scroll on mobile, subscription quota
 * box, invoices grid).
 */
export function DashboardSkeleton() {
  return (
    <main className="pb-24 px-4 lg:px-6 lg:pb-8">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Welcome text */}
        <div className="text-center mb-8 lg:mb-12">
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>

        {/* Eye toggle row */}
        <div className="flex justify-end mb-4">
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Financial cards: 2 cards, mobile horizontal-scroll / desktop 2-col */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible mb-8 lg:mb-12">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[280px] lg:min-w-0 bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4"
            >
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-32" />
              <div className="border-t pt-3 mt-4 flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Subscription quota box */}
        <div className="mt-6 lg:mt-8 mb-6 lg:mb-8 bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-2.5 flex-1 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        {/* Invoices header + grid */}
        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
