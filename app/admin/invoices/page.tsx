import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminInvoices } from "@/app/actions/admin-invoices";
import { InvoiceFilters } from "@/components/features/admin/invoices/invoice-filters";
import { InvoicesTableWrapper } from "@/components/features/admin/invoices/invoices-table-wrapper";
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
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

  // Get users
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const users = (usersData?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "Unknown",
  }));

  // Get stores
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

async function InvoicesContent({
  searchParams,
}: {
  searchParams: Awaited<InvoicesPageProps["searchParams"]>;
}) {
  const userId = searchParams.userId || "";
  const storeId = searchParams.storeId || "";
  const status = searchParams.status as
    | "all"
    | "draft"
    | "pending"
    | "synced"
    | undefined;
  const dateFrom = searchParams.dateFrom || "";
  const dateTo = searchParams.dateTo || "";
  const amountMin = searchParams.amountMin || "";
  const amountMax = searchParams.amountMax || "";
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1", 10);

  const [result, filterOptions] = await Promise.all([
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
    getFilterOptions(),
  ]);

  const invoices = result.data?.invoices || [];
  const total = result.data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all invoices from all users
        </p>
      </div>

      <InvoiceFilters
        initialFilters={{
          userId,
          storeId,
          status: status || "all",
          dateFrom,
          dateTo,
          amountMin,
          amountMax,
          search,
        }}
        users={filterOptions.users}
        stores={filterOptions.stores}
      />

      {result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <InvoicesTableWrapper
        invoices={invoices}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!result.error && (
        <div className="text-sm text-muted-foreground">
          Showing {invoices.length} of {total} invoices
        </div>
      )}
    </div>
  );
}

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<InvoicesPageSkeleton />}>
      <InvoicesContent searchParams={params} />
    </Suspense>
  );
}
