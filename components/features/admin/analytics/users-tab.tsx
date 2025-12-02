"use client";

import { useState, useTransition } from "react";
import { MetricsCard } from "@/components/features/admin/metrics-card";
import { LineChart } from "./charts/line-chart";
import { PieChart } from "./charts/pie-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Users,
  UserPlus,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { exportAdminUserGrowthCSV } from "@/app/actions/admin-analytics";
import type {
  UserAnalytics,
  AnalyticsDateRange,
} from "@/lib/db/services/admin-analytics.service";

interface UsersTabProps {
  data: UserAnalytics | null;
  dateRange: AnalyticsDateRange;
  isLoading?: boolean;
  error?: string;
}

/**
 * Format number with thousand separators
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Format percentage value
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Users tab component for analytics dashboard
 */
export function UsersTab({ data, dateRange, isLoading, error }: UsersTabProps) {
  const [isPending, startTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    setExportError(null);
    startTransition(async () => {
      const result = await exportAdminUserGrowthCSV(dateRange);
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user-growth-${dateRange.from}-to-${dateRange.to}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setExportError(result.error || "Failed to export CSV");
      }
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <p>Error loading user data: {error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <UsersTabSkeleton />;
  }

  // Prepare chart data
  const dailyRegistrationsData = data.dailyRegistrations.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  const tierDistributionData = data.usersByTier.map((t) => ({
    name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
    value: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          label="Total Users"
          value={formatNumber(data.totalUsers)}
          description={`Period: ${dateRange.from} to ${dateRange.to}`}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricsCard
          label="New Users This Month"
          value={formatNumber(data.newUsersThisMonth)}
          description="Current calendar month"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <MetricsCard
          label="Active Premium Users"
          value={formatNumber(data.activeUsers)}
          description="Users with active subscription"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Conversion & Churn Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Conversion Rate</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-green-600">
              {formatPercentage(data.conversionRate)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Free users who upgraded to premium in period
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">Churn Rate</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-red-600">
              {formatPercentage(data.churnRate)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Premium users who did not renew subscription
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Registrations Chart */}
        <div className="rounded-lg border bg-card p-6">
          <LineChart
            data={dailyRegistrationsData}
            title="Daily New Registrations"
            color="#10b981"
            formatValue={(v) => formatNumber(v)}
            height={300}
          />
        </div>

        {/* User Distribution by Tier */}
        <div className="rounded-lg border bg-card p-6">
          <PieChart
            data={tierDistributionData}
            title="User Distribution by Tier"
            formatValue={(v) => formatNumber(v)}
            height={300}
            innerRadius={40}
            outerRadius={80}
          />
        </div>
      </div>

      {/* Export Button */}
      <div className="flex items-center justify-between">
        <div>
          {exportError && <p className="text-sm text-red-500">{exportError}</p>}
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          {isPending ? "Exporting..." : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for users tab
 */
function UsersTabSkeleton() {
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

      {/* Conversion & Churn Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-48 mt-2" />
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
