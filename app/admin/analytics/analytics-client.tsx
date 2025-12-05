"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAnalytics } from "@/lib/hooks/use-admin-data";
import {
  AnalyticsTabs,
  DateRangePicker,
  RevenueTab,
  UsersTab,
  InvoicesTab,
  type AnalyticsTabType,
} from "@/components/features/admin/analytics";
import { getDefaultDateRange } from "@/lib/utils/date-range";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  RevenueAnalytics,
  UserAnalytics,
  InvoiceAnalytics,
} from "@/lib/db/services/admin-analytics.service";

interface AnalyticsClientProps {
  initialData: null;
}

function AnalyticsSkeleton() {
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

export function AnalyticsClient({
  initialData: _initialData,
}: AnalyticsClientProps) {
  const searchParams = useSearchParams();
  const defaultRange = getDefaultDateRange();

  const tab = (searchParams.get("tab") as AnalyticsTabType) || "revenue";
  const from = searchParams.get("from") || defaultRange.from;
  const to = searchParams.get("to") || defaultRange.to;

  const { data, isLoading, error } = useAdminAnalytics(
    { tab, from, to },
    undefined
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (isLoading && !data)) {
    return <AnalyticsSkeleton />;
  }

  const dateRange = { from, to };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and trends
          </p>
        </div>
        <DateRangePicker dateRange={dateRange} />
      </div>

      <AnalyticsTabs activeTab={tab} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      {!error && tab === "revenue" && (
        <RevenueTab
          data={(data as RevenueAnalytics | undefined) || null}
          dateRange={dateRange}
          error={undefined}
        />
      )}
      {!error && tab === "users" && (
        <UsersTab
          data={(data as UserAnalytics | undefined) || null}
          dateRange={dateRange}
          error={undefined}
        />
      )}
      {!error && tab === "invoices" && (
        <InvoicesTab
          data={(data as InvoiceAnalytics | undefined) || null}
          dateRange={dateRange}
          error={undefined}
        />
      )}
    </div>
  );
}
