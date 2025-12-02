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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TransactionFiltersState {
  status: "all" | "pending" | "completed" | "failed";
  dateFrom: string;
  dateTo: string;
}

interface TransactionFiltersProps {
  initialFilters: TransactionFiltersState;
}

/**
 * Transaction filters component for admin payment transaction viewer
 * Uses URL-based state for server-side filtering
 */
export function TransactionFilters({
  initialFilters,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (updates: Partial<TransactionFiltersState>) => {
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
        router.push(`/admin/transactions?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateUrl({ status: value as TransactionFiltersState["status"] });
    },
    [updateUrl]
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateUrl({ dateFrom: e.target.value });
    },
    [updateUrl]
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateUrl({ dateTo: e.target.value });
    },
    [updateUrl]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[160px]">
        <Label
          htmlFor="dateFrom"
          className="text-xs text-muted-foreground mb-1 block"
        >
          From Date
        </Label>
        <Input
          id="dateFrom"
          type="date"
          defaultValue={initialFilters.dateFrom}
          onChange={handleDateFromChange}
          className="w-full"
          disabled={isPending}
        />
      </div>

      <div className="w-full sm:w-[160px]">
        <Label
          htmlFor="dateTo"
          className="text-xs text-muted-foreground mb-1 block"
        >
          To Date
        </Label>
        <Input
          id="dateTo"
          type="date"
          defaultValue={initialFilters.dateTo}
          onChange={handleDateToChange}
          className="w-full"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
