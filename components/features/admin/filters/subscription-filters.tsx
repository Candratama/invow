"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SubscriptionFiltersState {
  tier: "all" | "free" | "premium";
  status: "all" | "active" | "expired" | "expiring_soon";
}

interface SubscriptionFiltersProps {
  initialFilters: SubscriptionFiltersState;
}

/**
 * Subscription filters component for admin subscription management
 * Uses URL-based state for server-side filtering
 */
export function SubscriptionFilters({
  initialFilters,
}: SubscriptionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (updates: Partial<SubscriptionFiltersState>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page when filters change
      params.delete("page");

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      startTransition(() => {
        router.push(`/admin/subscriptions?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleTierChange = useCallback(
    (value: string) => {
      updateUrl({ tier: value as SubscriptionFiltersState["tier"] });
    },
    [updateUrl]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateUrl({ status: value as SubscriptionFiltersState["status"] });
    },
    [updateUrl]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="w-full sm:w-[140px]">
        <Select
          value={initialFilters.tier}
          onValueChange={handleTierChange}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[160px]">
        <Select
          value={initialFilters.status}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
