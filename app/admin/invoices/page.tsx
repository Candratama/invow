import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getAdminInvoices } from "@/app/actions/admin-invoices";
import { InvoicesClient } from "./invoices-client";

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

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
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

  // Check if this is a client-side navigation
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/admin");

  let initialData = null;
  let filterOptions = {
    users: [] as Array<{ id: string; email: string }>,
    stores: [] as Array<{ id: string; name: string }>,
  };

  // Skip server fetch for client navigation - React Query will use cached data
  if (!isClientNavigation) {
    const [result, options] = await Promise.all([
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

    initialData = result.data || null;
    filterOptions = options;
  }

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
