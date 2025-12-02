"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounce";

export interface UserFiltersState {
  tier: "all" | "free" | "premium";
  status: "all" | "active" | "expired";
  search: string;
}

interface UserFiltersProps {
  initialFilters: UserFiltersState;
}

/**
 * User filters component for admin user management
 * Uses URL-based state for server-side filtering
 */
export function UserFilters({ initialFilters }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (updates: Partial<UserFiltersState>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page when filters change
      params.delete("page");

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleTierChange = useCallback(
    (value: string) => {
      updateUrl({ tier: value as UserFiltersState["tier"] });
    },
    [updateUrl]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateUrl({ status: value as UserFiltersState["status"] });
    },
    [updateUrl]
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateUrl({ search: value });
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <div className="w-full sm:w-[140px]">
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
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative w-full sm:w-[280px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by email..."
          defaultValue={initialFilters.search}
          onChange={handleSearchChange}
          className="pl-9"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
