"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUsers } from "@/app/actions/admin";
import {
  UserFilters,
  type UserFiltersState,
} from "@/components/features/admin/filters/user-filters";
import { UsersTable } from "@/components/features/admin/users-table";
import type { UserListItem } from "@/lib/db/services/admin-users.service";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<UserFiltersState>({
    tier: (searchParams.get("tier") as UserFiltersState["tier"]) || "all",
    status: (searchParams.get("status") as UserFiltersState["status"]) || "all",
    search: searchParams.get("search") || "",
  });
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: UserFiltersState, page: number) => {
      const params = new URLSearchParams();
      if (newFilters.tier !== "all") params.set("tier", newFilters.tier);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.search) params.set("search", newFilters.search);
      if (page > 1) params.set("page", page.toString());

      const queryString = params.toString();
      router.push(`/admin/users${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsers({
        tier: filters.tier === "all" ? undefined : filters.tier,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      if (!result.success || !result.data) {
        setError(result.error || "Failed to fetch users");
        setUsers([]);
        setTotal(0);
      } else {
        setUsers(result.data.users);
        setTotal(result.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Fetch users when filters or page changes
  useEffect(() => {
    startTransition(() => {
      fetchUsers();
    });
  }, [fetchUsers]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: UserFiltersState) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page on filter change
      updateUrl(newFilters, 1);
    },
    [updateUrl]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateUrl(filters, page);
    },
    [filters, updateUrl]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view all registered users
        </p>
      </div>

      {/* Filters */}
      <UserFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <UsersTable
        users={users}
        total={total}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
        isLoading={isLoading || isPending}
      />

      {/* Results Summary */}
      {!isLoading && !error && (
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
        </div>
      )}
    </div>
  );
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

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersPageContent />
    </Suspense>
  );
}
