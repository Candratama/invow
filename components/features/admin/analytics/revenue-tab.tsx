"use client";

import { useState, useTransition } from "react";
import { MetricsCard } from "@/components/features/admin/metrics-card";
import { LineChart } from "./charts/line-chart";
import { BarChart } from "./charts/bar-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import { exportAdminRevenueCSV } from "@/app/actions/admin-analytics";
import type {
  RevenueAnalytics,
  AnalyticsDateRange,
} from "@/lib/db/services/admin-analytics.service";

interface RevenueTabProps {
  data: RevenueAnalytics | null;
  dateRange: AnalyticsDateRange;
  isLoading?: boolean;
  error?: string;
}

/**
 * Format currency value to Indonesian Rupiah
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format short currency (for chart axis)
 */
function formatShortCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

/**
 * Revenue tab component for analytics dashboard
 */
export function RevenueTab({
  data,
  dateRange,
  isLoading,
  error,
}: RevenueTabProps) {
  const [isPending, startTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    setExportError(null);
    startTransition(async () => {
      const result = await exportAdminRevenueCSV(dateRange);
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `revenue-${dateRange.from}-to-${dateRange.to}.csv`;
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
        <p>Error loading revenue data: {error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <RevenueTabSkeleton />;
  }

  // Prepare chart data
  const dailyRevenueData = data.dailyRevenue.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  const tierBreakdownData = data.revenueByTier.map((t) => ({
    name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
    value: t.amount,
  }));

  const isPositiveChange = data.percentageChange >= 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          description={`Period: ${dateRange.from} to ${dateRange.to}`}
          trend={{
            value: Math.abs(data.percentageChange),
            isPositive: isPositiveChange,
          }}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricsCard
          label="Monthly Revenue"
          value={formatCurrency(data.monthlyRevenue)}
          description="Current calendar month"
          icon={<Calendar className="h-5 w-5" />}
        />
        <MetricsCard
          label="Average Transaction"
          value={formatCurrency(data.averageTransactionValue)}
          description="Per completed transaction"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Period Comparison */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          {isPositiveChange ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isPositiveChange ? "Up" : "Down"}{" "}
            {Math.abs(data.percentageChange).toFixed(1)}% from previous period
          </span>
          <span className="text-sm text-muted-foreground">
            (Previous: {formatCurrency(data.previousPeriodRevenue)})
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Revenue Chart */}
        <div className="rounded-lg border bg-card p-6">
          <LineChart
            data={dailyRevenueData}
            title="Daily Revenue"
            color="#3b82f6"
            formatValue={formatShortCurrency}
            height={300}
          />
        </div>

        {/* Revenue by Tier */}
        <div className="rounded-lg border bg-card p-6">
          <BarChart
            data={tierBreakdownData}
            title="Revenue by Tier"
            formatValue={formatShortCurrency}
            height={300}
            layout="vertical"
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
 * Loading skeleton for revenue tab
 */
function RevenueTabSkeleton() {
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

      {/* Period Comparison */}
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-64" />
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
