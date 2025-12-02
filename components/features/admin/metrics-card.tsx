"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

/**
 * Metrics card component for admin dashboard
 * Displays a metric value with label and optional trend indicator
 */
export function MetricsCard({
  label,
  value,
  description,
  trend,
  icon,
  isLoading = false,
  className,
}: MetricsCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          {icon && <Skeleton className="h-5 w-5 rounded" />}
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-32" />
        </div>
        {description && (
          <div className="mt-2">
            <Skeleton className="h-3 w-40" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
