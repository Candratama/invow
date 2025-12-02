"use client";

import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface UserFiltersState {
  tier: "all" | "free" | "premium";
  status: "all" | "active" | "expired";
  search: string;
}

interface UserFiltersProps {
  filters: UserFiltersState;
  onFiltersChange: (filters: UserFiltersState) => void;
}

/**
 * User filters component for admin user management
 * Provides tier dropdown, status dropdown, and search input
 */
export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const handleTierChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        tier: value as UserFiltersState["tier"],
      });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value as UserFiltersState["status"],
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        search: e.target.value,
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <div className="w-full sm:w-[140px]">
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-[280px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by email..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>
    </div>
  );
}
