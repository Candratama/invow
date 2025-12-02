"use client";

import { useCallback } from "react";
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
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}

/**
 * Transaction filters component for admin payment transaction viewer
 * Provides status dropdown and date range picker filters
 */
export function TransactionFilters({
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value as TransactionFiltersState["status"],
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        dateFrom: e.target.value,
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        dateTo: e.target.value,
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      {/* Status Filter */}
      <div className="w-full sm:w-[160px]">
        <Select value={filters.status} onValueChange={handleStatusChange}>
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

      {/* Date From Filter */}
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
          value={filters.dateFrom}
          onChange={handleDateFromChange}
          className="w-full"
        />
      </div>

      {/* Date To Filter */}
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
          value={filters.dateTo}
          onChange={handleDateToChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
