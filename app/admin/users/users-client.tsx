"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

export function UsersClient({ initialData }: UsersClientProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const tier = searchParams.get("tier") || "all";
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, error } = useAdminUsers(
    {
      tier,
      status,
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
    return <UsersPageSkeleton />;
  }

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
          tier: tier as "all" | "free" | "premium",
          status: status as "all" | "active" | "expired",
          search,
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
        currentPage={page}
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
