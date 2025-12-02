"use client";

import { ReactNode } from "react";
import { MetricsCard } from "@/components/features/admin/metrics-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricItem {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface MetricsRowProps {
  metrics: MetricItem[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
}

/**
 * Reusable metrics row component for analytics dashboard
 * Displays a grid of metric cards
 */
export function MetricsRow({
  metrics,
  isLoading,
  columns = 3,
}: MetricsRowProps) {
  if (isLoading) {
    return <MetricsRowSkeleton count={metrics.length} columns={columns} />;
  }

  const gridClass =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 4
      ? "md:grid-cols-4"
      : "md:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {metrics.map((metric, index) => (
        <MetricsCard
          key={index}
          label={metric.label}
          value={String(metric.value)}
          description={metric.description}
          icon={metric.icon}
          trend={metric.trend}
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for metrics row
 */
function MetricsRowSkeleton({
  count,
  columns,
}: {
  count: number;
  columns: number;
}) {
  const gridClass =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 4
      ? "md:grid-cols-4"
      : "md:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40 mt-2" />
        </div>
      ))}
    </div>
  );
}
