import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getAdminStores } from "@/app/actions/admin-stores";
import { StoresClient } from "./stores-client";

const PAGE_SIZE = 10;

interface StoresPageProps {
  searchParams: Promise<{
    userId?: string;
    isActive?: string;
    search?: string;
    page?: string;
  }>;
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

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const users = (usersData?.users || []).map((u) => ({
    id: u.id,
    email: u.email || "Unknown",
  }));

  return { users };
}

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const params = await searchParams;

  const userId = params.userId || "";
  const isActive = params.isActive as "all" | "true" | "false" | undefined;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  // Check if this is a client-side navigation
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/admin");

  let initialData = null;
  let filterOptions = { users: [] as Array<{ id: string; email: string }> };

  // Skip server fetch for client navigation - React Query will use cached data
  if (!isClientNavigation) {
    let isActiveFilter: boolean | undefined;
    if (isActive === "true") {
      isActiveFilter = true;
    } else if (isActive === "false") {
      isActiveFilter = false;
    }

    const [result, options] = await Promise.all([
      getAdminStores({
        userId: userId || undefined,
        isActive: isActiveFilter,
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
