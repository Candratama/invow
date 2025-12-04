import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminStores } from "@/app/actions/admin-stores";
import { StoresClient } from "./stores-client";
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
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[200px]" />
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

/**
 * Get users for filter dropdown with caching
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

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const users = (usersData?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "Unknown",
  }));

  return { users };
}

// Cache filter options for 5 minutes
let filterOptionsCache: { users: Array<{ id: string; email: string }> } | null =
  null;
let filterOptionsCacheTime = 0;
const FILTER_OPTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedFilterOptions() {
  const now = Date.now();
  if (
    filterOptionsCache &&
    now - filterOptionsCacheTime < FILTER_OPTIONS_CACHE_TTL
  ) {
    return filterOptionsCache;
  }

  filterOptionsCache = await getFilterOptions();
  filterOptionsCacheTime = now;
  return filterOptionsCache;
}

async function StoresContent({ searchParams }: StoresPageProps) {
  const params = await searchParams;

  const userId = params.userId || "";
  const isActive = params.isActive as "all" | "true" | "false" | undefined;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  let isActiveFilter: boolean | undefined;
  if (isActive === "true") {
    isActiveFilter = true;
  } else if (isActive === "false") {
    isActiveFilter = false;
  }

  // Always fetch on server - React Query will cache for subsequent navigations
  const [filterOptions, result] = await Promise.all([
    getCachedFilterOptions(),
    getAdminStores({
      userId: userId || undefined,
      isActive: isActiveFilter,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const initialData = result.data || null;

  return (
    <StoresClient
      initialData={initialData}
      filters={{
        userId,
        isActive: isActive || "all",
        search,
        page,
      }}
      users={filterOptions.users}
    />
  );
}

export default function StoresPage({ searchParams }: StoresPageProps) {
  return (
    <Suspense fallback={<StoresPageSkeleton />}>
      <StoresContent searchParams={searchParams} />
    </Suspense>
  );
}
