import { RevenueCardSkeleton } from "@/components/skeletons/revenue-card-skeleton";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";

export default function DashboardLoading() {
  return (
    <main className="pb-24 px-4 lg:px-6 lg:pb-8">
      <div className="max-w-md lg:max-w-2xl mx-auto pt-8">
        {/* Welcome message skeleton */}
        <div className="text-left mb-8 lg:mb-12 lg:text-center">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse lg:mx-auto" />
        </div>

        {/* Revenue Cards Skeleton */}
        <RevenueCardSkeleton />

        {/* Invoices List Skeleton */}
        <InvoicesListSkeleton />
      </div>
    </main>
  );
}
