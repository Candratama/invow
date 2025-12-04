import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminInvoices } from "@/app/actions/admin-invoices";
import { InvoicesClient } from "./invoices-client";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface InvoicesPageProps {
  searchParams: Promise<{
    userId?: string;
    storeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
    search?: string;
    page?: string;
  }>;
}

function InvoicesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-[140px]" />
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
 * Get users and stores for filter dropdowns
 */
async function getFilterOptions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { users: [], stores: [] };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const users = (usersData?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "Unknown",
  }));

  const { data: storesData } = await supabaseAdmin
    .from("stores")
    .select("id, name")
    .order("name");
  const stores = (storesData || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return { users, stores };
}

// Cache filter options for 5 minutes
let filterOptionsCache: {
  users: Array<{ id: string; email: string }>;
  stores: Array<{ id: string; name: string }>;
} | null = null;
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

async function InvoicesContent({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;

  const userId = params.userId || "";
  const storeId = params.storeId || "";
  const status = params.status as
    | "all"
    | "draft"
    | "pending"
    | "synced"
    | undefined;
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const amountMin = params.amountMin || "";
  const amountMax = params.amountMax || "";
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  // Always fetch on server - React Query will cache for subsequent navigations
  const [filterOptions, result] = await Promise.all([
    getCachedFilterOptions(),
    getAdminInvoices({
      userId: userId || undefined,
      storeId: storeId || undefined,
      status: status === "all" ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const initialData = result.data || null;

  return (
    <InvoicesClient
      initialData={initialData}
      filters={{
        userId,
        storeId,
        status: status || "all",
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        search,
        page,
      }}
      users={filterOptions.users}
      stores={filterOptions.stores}
    />
  );
}

export default function InvoicesPage({ searchParams }: InvoicesPageProps) {
  return (
    <Suspense fallback={<InvoicesPageSkeleton />}>
      <InvoicesContent searchParams={searchParams} />
    </Suspense>
  );
}
