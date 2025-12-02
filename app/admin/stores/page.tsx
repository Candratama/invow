import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminStores } from "@/app/actions/admin-stores";
import { StoreFilters } from "@/components/features/admin/stores/store-filters";
import { StoresTableWrapper } from "@/components/features/admin/stores/stores-table-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface StoresPageProps {
  searchParams: Promise<{
    userId?: string;
    isActive?: string;
    search?: string;
    page?: string;
  }>;
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

/**
 * Get users for filter dropdown
 */
async function getFilterOptions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { users: [] };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get users
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const users = (usersData?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "Unknown",
  }));

  return { users };
}

async function StoresContent({
  searchParams,
}: {
  searchParams: Awaited<StoresPageProps["searchParams"]>;
}) {
  const userId = searchParams.userId || "";
  const isActive = searchParams.isActive as
    | "all"
    | "true"
    | "false"
    | undefined;
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1", 10);

  // Convert isActive string to boolean or undefined
  let isActiveFilter: boolean | "all" | undefined;
  if (isActive === "true") {
    isActiveFilter = true;
  } else if (isActive === "false") {
    isActiveFilter = false;
  } else {
    isActiveFilter = "all";
  }

  const [result, filterOptions] = await Promise.all([
    getAdminStores({
      userId: userId || undefined,
      isActive: isActiveFilter === "all" ? undefined : isActiveFilter,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getFilterOptions(),
  ]);

  const stores = result.data?.stores || [];
  const total = result.data?.total || 0;

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
          isActive: isActive || "all",
          search,
        }}
        users={filterOptions.users}
      />

      {result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <StoresTableWrapper
        stores={stores}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!result.error && (
        <div className="text-sm text-muted-foreground">
          Showing {stores.length} of {total} stores
        </div>
      )}
    </div>
  );
}

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<StoresPageSkeleton />}>
      <StoresContent searchParams={params} />
    </Suspense>
  );
}
