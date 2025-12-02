import { Suspense } from "react";
import {
  AnalyticsTabs,
  DateRangePicker,
  RevenueTab,
  UsersTab,
  InvoicesTab,
  getDefaultDateRange,
  type AnalyticsTabType,
} from "@/components/features/admin/analytics";
import {
  getAdminRevenueAnalytics,
  getAdminUserAnalytics,
  getAdminInvoiceAnalytics,
} from "@/app/actions/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsPageProps {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
  }>;
}

/**
 * Admin Analytics Page
 * Displays analytics dashboard with tabs for Revenue, Users, and Invoices
 * Requirements: 10.1-10.4
 */
export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;
  const tab = (params.tab as AnalyticsTabType) || "revenue";
  const defaultRange = getDefaultDateRange();
  const dateRange = {
    from: params.from || defaultRange.from,
    to: params.to || defaultRange.to,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and trends
          </p>
        </div>
        <Suspense fallback={<DateRangePickerSkeleton />}>
          <DateRangePicker dateRange={dateRange} />
        </Suspense>
      </div>

      {/* Tab Navigation */}
      <Suspense fallback={<TabsSkeleton />}>
        <AnalyticsTabs activeTab={tab} />
      </Suspense>

      {/* Tab Content */}
      <Suspense fallback={<TabContentSkeleton />}>
        <AnalyticsContent tab={tab} dateRange={dateRange} />
      </Suspense>
    </div>
  );
}

/**
 * Analytics content component that fetches and displays data based on active tab
 */
async function AnalyticsContent({
  tab,
  dateRange,
}: {
  tab: AnalyticsTabType;
  dateRange: { from: string; to: string };
}) {
  switch (tab) {
    case "revenue": {
      const result = await getAdminRevenueAnalytics(dateRange);
      return (
        <RevenueTab
          data={result.data || null}
          dateRange={dateRange}
          error={result.error}
        />
      );
    }
    case "users": {
      const result = await getAdminUserAnalytics(dateRange);
      return (
        <UsersTab
          data={result.data || null}
          dateRange={dateRange}
          error={result.error}
        />
      );
    }
    case "invoices": {
      const result = await getAdminInvoiceAnalytics(dateRange);
      return (
        <InvoicesTab
          data={result.data || null}
          dateRange={dateRange}
          error={result.error}
        />
      );
    }
    default:
      return null;
  }
}

/**
 * Loading skeleton for date range picker
 */
function DateRangePickerSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

/**
 * Loading skeleton for tabs
 */
function TabsSkeleton() {
  return (
    <div className="border-b">
      <div className="flex gap-1 -mb-px">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-28" />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for tab content
 */
function TabContentSkeleton() {
  return (
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
  );
}
