"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, RefreshCw } from "lucide-react";
import type { AnalyticsDateRange } from "@/lib/db/services/admin-analytics.service";

interface DateRangePickerProps {
  dateRange: AnalyticsDateRange;
  basePath?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): AnalyticsDateRange {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    from: thirtyDaysAgo.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

/**
 * Parse date range from URL search params
 */
export function parseDateRangeFromParams(
  searchParams: URLSearchParams
): AnalyticsDateRange {
  const defaultRange = getDefaultDateRange();
  const from = searchParams.get("from") || defaultRange.from;
  const to = searchParams.get("to") || defaultRange.to;
  return { from, to };
}

/**
 * Global date range picker for analytics dashboard
 * Updates URL params when date range changes
 */
export function DateRangePicker({
  dateRange,
  basePath = "/admin/analytics",
  onRefresh,
  isRefreshing,
}: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localFrom, setLocalFrom] = useState(dateRange.from);
  const [localTo, setLocalTo] = useState(dateRange.to);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", localFrom);
    params.set("to", localTo);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  const handlePreset = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - days);

    const from = pastDate.toISOString().split("T")[0];
    const to = today.toISOString().split("T")[0];

    setLocalFrom(from);
    setLocalTo(to);

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Date Range</span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="date-from" className="text-xs">
            From
          </Label>
          <Input
            id="date-from"
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date-to" className="text-xs">
            To
          </Label>
          <Input
            id="date-to"
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(7)}
          className="text-xs"
        >
          7D
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(30)}
          className="text-xs"
        >
          30D
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePreset(90)}
          className="text-xs"
        >
          90D
        </Button>
      </div>

      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
