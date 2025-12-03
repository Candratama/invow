import { headers } from "next/headers";
import { getUsers } from "@/app/actions/admin";
import { UsersClient } from "./users-client";

const PAGE_SIZE = 10;

interface UsersPageProps {
  searchParams: Promise<{
    tier?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  const tier = params.tier as "all" | "free" | "premium" | undefined;
  const status = params.status as "all" | "active" | "expired" | undefined;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  // Check if this is a client-side navigation
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  const isClientNavigation =
    referer.includes(host) && referer.includes("/admin");

  let initialData = null;

  // Skip server fetch for client navigation - React Query will use cached data
  if (!isClientNavigation) {
    const result = await getUsers({
      tier: tier === "all" ? undefined : tier,
      status: status === "all" ? undefined : status,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    });

    initialData = result.data || null;
  }

  return (
    <UsersClient
      initialData={initialData}
      filters={{
        tier: tier || "all",
        status: status || "all",
        search,
        page,
      }}
    />
  );
}
