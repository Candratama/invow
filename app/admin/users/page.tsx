import { Suspense } from "react";
import { getUsers } from "@/app/actions/admin";
import { UserFilters } from "@/components/features/admin/filters/user-filters";
import { UsersTable } from "@/components/features/admin/users-table";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface UsersPageProps {
  searchParams: Promise<{
    tier?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
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

async function UsersContent({
  searchParams,
}: {
  searchParams: Awaited<UsersPageProps["searchParams"]>;
}) {
  const tier = searchParams.tier as "all" | "free" | "premium" | undefined;
  const status = searchParams.status as
    | "all"
    | "active"
    | "expired"
    | undefined;
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1", 10);

  const result = await getUsers({
    tier: tier === "all" ? undefined : tier,
    status: status === "all" ? undefined : status,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const users = result.data?.users || [];
  const total = result.data?.total || 0;

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
          tier: tier || "all",
          status: status || "all",
          search,
        }}
      />

      {result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <UsersTable
        users={users}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!result.error && (
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
        </div>
      )}
    </div>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersContent searchParams={params} />
    </Suspense>
  );
}
