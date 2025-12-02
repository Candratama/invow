import { Suspense } from "react";
import { getSubscriptions } from "@/app/actions/admin";
import { SubscriptionFilters } from "@/components/features/admin/filters/subscription-filters";
import { SubscriptionsTable } from "@/components/features/admin/subscriptions-table";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface SubscriptionsPageProps {
  searchParams: Promise<{
    tier?: string;
    status?: string;
    page?: string;
  }>;
}

function SubscriptionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function SubscriptionsContent({
  searchParams,
}: {
  searchParams: Awaited<SubscriptionsPageProps["searchParams"]>;
}) {
  const tier = searchParams.tier as "all" | "free" | "premium" | undefined;
  const status = searchParams.status as
    | "all"
    | "active"
    | "expired"
    | "expiring_soon"
    | undefined;
  const page = parseInt(searchParams.page || "1", 10);

  const result = await getSubscriptions({
    tier: tier === "all" ? undefined : tier,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const subscriptions = result.data?.subscriptions || [];
  const total = result.data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all user subscriptions
        </p>
      </div>

      <SubscriptionFilters
        initialFilters={{
          tier: tier || "all",
          status: status || "all",
        }}
      />

      {result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <SubscriptionsTable
        subscriptions={subscriptions}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!result.error && (
        <div className="text-sm text-muted-foreground">
          Showing {subscriptions.length} of {total} subscriptions
        </div>
      )}
    </div>
  );
}

export default async function SubscriptionsPage({
  searchParams,
}: SubscriptionsPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<SubscriptionsPageSkeleton />}>
      <SubscriptionsContent searchParams={params} />
    </Suspense>
  );
}
