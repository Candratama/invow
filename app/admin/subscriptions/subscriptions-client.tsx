"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAdminSubscriptions } from "@/lib/hooks/use-admin-data";
import { SubscriptionFilters } from "@/components/features/admin/filters/subscription-filters";
import { SubscriptionsTable } from "@/components/features/admin/subscriptions-table";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

import type { SubscriptionListItem } from "@/lib/db/data-access/admin";

interface SubscriptionsData {
  subscriptions: SubscriptionListItem[];
  total: number;
}

interface SubscriptionsClientProps {
  initialData: SubscriptionsData | null;
}

function SubscriptionsSkeleton() {
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

export function SubscriptionsClient({ initialData }: SubscriptionsClientProps) {
  const searchParams = useSearchParams();

  const tier = searchParams.get("tier") || "all";
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, error } = useAdminSubscriptions<SubscriptionsData>(
    { tier, status, page, pageSize: PAGE_SIZE },
    initialData ?? undefined
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (isLoading && !data)) {
    return <SubscriptionsSkeleton />;
  }

  const subscriptions = data?.subscriptions || [];
  const total = data?.total || 0;

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
          tier: tier as "all" | "free" | "premium",
          status: status as "all" | "active" | "expired" | "expiring_soon",
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      <SubscriptionsTable
        subscriptions={subscriptions}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!error && (
        <div className="text-sm text-muted-foreground">
          Showing {subscriptions.length} of {total} subscriptions
        </div>
      )}
    </div>
  );
}
