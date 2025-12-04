"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  users: initialUsers,
}: StoresClientProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  const userId = searchParams.get("userId") || "";
  const isActiveParam = searchParams.get("isActive") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Fetch users list for filter if not provided
  useEffect(() => {
    if (users.length === 0) {
      // Fetch users via server action
      import("@/app/actions/admin").then(({ getUsers }) => {
        getUsers({ page: 1, pageSize: 1000 }).then((result) => {
          if (result.success && result.data) {
            const usersList = result.data.users.map(
              (u: { id: string; email: string }) => ({
                id: u.id,
                email: u.email,
              })
            );
            setUsers(usersList);
          }
        });
      });
    }
  }, [users.length]);

  // Convert isActive string to boolean or "all"
  let isActiveFilter: boolean | "all" = "all";
  if (isActiveParam === "true") {
    isActiveFilter = true;
  } else if (isActiveParam === "false") {
    isActiveFilter = false;
  }

  const { data, isLoading, error } = useAdminStores(
    {
      userId,
      isActive: isActiveFilter,
      search,
      page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (isLoading && !data)) {
    return <StoresPageSkeleton />;
  }

  const stores = (data?.stores || []) as StoreListItem[];
  const total = data?.total || 0;

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
          userId,
          isActive: isActiveParam as "all" | "true" | "false",
          search,
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
        currentPage={page}
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
