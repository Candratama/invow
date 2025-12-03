"use client";

import { StoreFilters } from "@/components/features/admin/stores/store-filters";
import { StoresTableWrapper } from "@/components/features/admin/stores/stores-table-wrapper";
import { useAdminStores } from "@/lib/hooks/use-admin-data";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoreListItem } from "@/lib/db/services/admin-stores.service";

const PAGE_SIZE = 10;

interface StoresClientProps {
  initialData: {
    stores: unknown[];
    total: number;
  } | null;
  filters: {
    userId: string;
    isActive: string;
    search: string;
    page: number;
  };
  users: Array<{ id: string; email: string }>;
}

function StoresPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoresClient({
  initialData,
  filters,
  users,
}: StoresClientProps) {
  // Convert isActive string to boolean or "all"
  let isActiveFilter: boolean | "all" = "all";
  if (filters.isActive === "true") {
    isActiveFilter = true;
  } else if (filters.isActive === "false") {
    isActiveFilter = false;
  }

  const { data, isLoading, error } = useAdminStores(
    {
      userId: filters.userId,
      isActive: isActiveFilter,
      search: filters.search,
      page: filters.page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  const stores = (data?.stores || []) as StoreListItem[];
  const total = data?.total || 0;

  if (isLoading && !initialData) {
    return <StoresPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all stores from all users
        </p>
      </div>

      <StoreFilters
        initialFilters={{
          userId: filters.userId,
          isActive: (filters.isActive || "all") as "all" | "true" | "false",
          search: filters.search,
        }}
        users={users}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : "Failed to load stores"}
          </p>
        </div>
      )}

      <StoresTableWrapper
        stores={stores}
        total={total}
        currentPage={filters.page}
        pageSize={PAGE_SIZE}
      />

      {!error && (
        <div className="text-sm text-muted-foreground">
          Showing {stores.length} of {total} stores
        </div>
      )}
    </div>
  );
}
