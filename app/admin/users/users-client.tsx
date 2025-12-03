"use client";

import { UserFilters } from "@/components/features/admin/filters/user-filters";
import { UsersTable } from "@/components/features/admin/users-table";
import { useAdminUsers } from "@/lib/hooks/use-admin-data";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface UsersClientProps {
  initialData: {
    users: unknown[];
    total: number;
  } | null;
  filters: {
    tier: string;
    status: string;
    search: string;
    page: number;
  };
}

function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[280px]" />
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsersClient({ initialData, filters }: UsersClientProps) {
  const { data, isLoading, error } = useAdminUsers(
    {
      tier: filters.tier,
      status: filters.status,
      search: filters.search,
      page: filters.page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  const users = (data?.users || []) as Array<{
    id: string;
    email: string;
    tier: string;
    subscriptionStatus: "active" | "expired" | "none";
    invoiceCount: number;
    currentMonthCount: number;
    invoiceLimit: number;
    createdAt: string;
  }>;
  const total = data?.total || 0;

  if (isLoading && !initialData) {
    return <UsersPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view all registered users
        </p>
      </div>

      <UserFilters
        initialFilters={{
          tier: (filters.tier || "all") as "all" | "free" | "premium",
          status: (filters.status || "all") as "all" | "active" | "expired",
          search: filters.search,
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error ? error.message : "Failed to load users"}
          </p>
        </div>
      )}

      <UsersTable
        users={users}
        total={total}
        currentPage={filters.page}
        pageSize={PAGE_SIZE}
      />

      {!error && (
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
        </div>
      )}
    </div>
  );
}
