"use client";

import { useCallback } from "react";
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
  filters: SubscriptionFiltersState;
  onFiltersChange: (filters: SubscriptionFiltersState) => void;
}

/**
 * Subscription filters component for admin subscription management
 * Provides tier dropdown and status dropdown filters
 */
export function SubscriptionFilters({
  filters,
  onFiltersChange,
}: SubscriptionFiltersProps) {
  const handleTierChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        tier: value as SubscriptionFiltersState["tier"],
      });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value as SubscriptionFiltersState["status"],
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Tier Filter */}
      <div className="w-full sm:w-[140px]">
        <Select value={filters.tier} onValueChange={handleTierChange}>
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

      {/* Status Filter */}
      <div className="w-full sm:w-[160px]">
        <Select value={filters.status} onValueChange={handleStatusChange}>
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
