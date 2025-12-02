"use client";

import { useState, useTransition } from "react";
import { MetricsCard } from "@/components/features/admin/metrics-card";
import { LineChart } from "./charts/line-chart";
import { PieChart } from "./charts/pie-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  FilePlus,
  Calculator,
  DollarSign,
} from "lucide-react";
import { exportAdminInvoiceCSV } from "@/app/actions/admin-analytics";
import type {
  InvoiceAnalytics,
  AnalyticsDateRange,
} from "@/lib/db/services/admin-analytics.service";

interface InvoicesTabProps {
  data: InvoiceAnalytics | null;
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
 * Invoices tab component for analytics dashboard
 */
export function InvoicesTab({
  data,
  dateRange,
  isLoading,
  error,
}: InvoicesTabProps) {
  const [isPending, startTransition] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    setExportError(null);
    startTransition(async () => {
      const result = await exportAdminInvoiceCSV(dateRange);
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoices-${dateRange.from}-to-${dateRange.to}.csv`;
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
        <p>Error loading invoice data: {error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <InvoicesTabSkeleton />;
  }

  // Prepare chart data
  const dailyInvoicesData = data.dailyInvoices.map((d) => ({
    date: d.date,
    value: d.value,
  }));

  const statusDistributionData = data.invoicesByStatus.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          label="Total Invoices"
          value={formatNumber(data.totalInvoices)}
          description={`Period: ${dateRange.from} to ${dateRange.to}`}
          icon={<FileText className="h-5 w-5" />}
        />
        <MetricsCard
          label="Invoices This Month"
          value={formatNumber(data.invoicesThisMonth)}
          description="Current calendar month"
          icon={<FilePlus className="h-5 w-5" />}
        />
        <MetricsCard
          label="Average per User"
          value={data.averageInvoicesPerUser.toFixed(2)}
          description="Invoices per user in period"
          icon={<Calculator className="h-5 w-5" />}
        />
      </div>

      {/* Value Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Average Invoice Value</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(data.averageInvoiceValue)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Average value per invoice
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Total Invoice Value</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.totalInvoiceValue)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all invoice totals
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Invoices Chart */}
        <div className="rounded-lg border bg-card p-6">
          <LineChart
            data={dailyInvoicesData}
            title="Daily Invoice Creation"
            color="#8b5cf6"
            formatValue={(v) => formatNumber(v)}
            height={300}
          />
        </div>

        {/* Status Distribution */}
        <div className="rounded-lg border bg-card p-6">
          <PieChart
            data={statusDistributionData}
            title="Invoice Status Distribution"
            formatValue={(v) => formatNumber(v)}
            height={300}
            innerRadius={40}
            outerRadius={80}
          />
        </div>
      </div>

      {/* Top Users Table */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          Top Users by Invoice Count
        </h3>
        {data.topUsersByInvoiceCount.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Rank</th>
                  <th className="text-left py-2 px-4 font-medium">
                    User Email
                  </th>
                  <th className="text-right py-2 px-4 font-medium">
                    Invoice Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topUsersByInvoiceCount.map((user, index) => (
                  <tr key={user.userEmail} className="border-b last:border-0">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{user.userEmail}</td>
                    <td className="py-2 px-4 text-right font-medium">
                      {formatNumber(user.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No invoice data available
          </p>
        )}
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
 * Loading skeleton for invoices tab
 */
function InvoicesTabSkeleton() {
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

      {/* Value Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-8 w-40" />
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

      {/* Top Users Table */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
