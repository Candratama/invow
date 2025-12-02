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

export interface InvoiceFiltersState {
  userId: string;
  storeId: string;
  status: "all" | "draft" | "pending" | "synced";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  search: string;
}

interface UserOption {
  id: string;
  email: string;
}

interface StoreOption {
  id: string;
  name: string;
}

interface InvoiceFiltersProps {
  initialFilters: InvoiceFiltersState;
  users?: UserOption[];
  stores?: StoreOption[];
}

/**
 * Invoice filters component for admin invoice management
 * Uses URL-based state for server-side filtering
 */
export function InvoiceFilters({
  initialFilters,
  users = [],
  stores = [],
}: InvoiceFiltersProps) {
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
    (updates: Partial<InvoiceFiltersState>) => {
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
        router.push(`/admin/invoices?${params.toString()}`, {
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

  const handleStoreChange = useCallback(
    (value: string) => {
      updateUrl({ storeId: value === "all" ? "" : value });
    },
    [updateUrl]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateUrl({ status: value as InvoiceFiltersState["status"] });
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

  const handleAmountMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateUrl({ amountMin: e.target.value });
    },
    [updateUrl]
  );

  const handleAmountMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateUrl({ amountMax: e.target.value });
    },
    [updateUrl]
  );

  return (
    <div className="space-y-4">
      {/* First row: User, Store, Status, Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="w-full sm:w-[180px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            User
          </Label>
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

        <div className="w-full sm:w-[180px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Store
          </Label>
          <Select
            value={initialFilters.storeId || "all"}
            onValueChange={handleStoreChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
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
            value={initialFilters.status}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Search
          </Label>
          <Input
            type="text"
            placeholder="Invoice # or Customer"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Second row: Date range and Amount range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="w-full sm:w-[140px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            From Date
          </Label>
          <Input
            type="date"
            defaultValue={initialFilters.dateFrom}
            onChange={handleDateFromChange}
            className="w-full"
            disabled={isPending}
          />
        </div>

        <div className="w-full sm:w-[140px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            To Date
          </Label>
          <Input
            type="date"
            defaultValue={initialFilters.dateTo}
            onChange={handleDateToChange}
            className="w-full"
            disabled={isPending}
          />
        </div>

        <div className="w-full sm:w-[120px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Min Amount
          </Label>
          <Input
            type="number"
            placeholder="0"
            defaultValue={initialFilters.amountMin}
            onChange={handleAmountMinChange}
            className="w-full"
            disabled={isPending}
          />
        </div>

        <div className="w-full sm:w-[120px]">
          <Label className="text-xs text-muted-foreground mb-1 block">
            Max Amount
          </Label>
          <Input
            type="number"
            placeholder="∞"
            defaultValue={initialFilters.amountMax}
            onChange={handleAmountMaxChange}
            className="w-full"
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
