"use client";

import { useCallback, useTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StoreFiltersState {
  userId: string;
  isActive: "all" | "true" | "false";
  search: string;
}

interface UserOption {
  id: string;
  email: string;
}

interface StoreFiltersProps {
  initialFilters: StoreFiltersState;
  users?: UserOption[];
}

/**
 * Store filters component for admin store management
 * Uses URL-based state for server-side filtering
 */
export function StoreFilters({
  initialFilters,
  users = [],
}: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialFilters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== initialFilters.search) {
        updateUrl({ search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const updateUrl = useCallback(
    (updates: Partial<StoreFiltersState>) => {
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
        router.push(`/admin/stores?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleUserChange = useCallback(
    (value: string) => {
      updateUrl({ userId: value === "all" ? "" : value });
    },
    [updateUrl]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateUrl({ isActive: value as StoreFiltersState["isActive"] });
    },
    [updateUrl]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="w-full sm:w-[180px]">
        <Label className="text-xs text-muted-foreground mb-1 block">User</Label>
        <Select
          value={initialFilters.userId || "all"}
          onValueChange={handleUserChange}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Status
        </Label>
        <Select
          value={initialFilters.isActive}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Search
        </Label>
        <Input
          type="text"
          placeholder="Name or Store Code"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
