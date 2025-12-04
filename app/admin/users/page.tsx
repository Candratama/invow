import { Suspense } from "react";
import { getUsers } from "@/app/actions/admin";
import { UsersClient } from "./users-client";
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

async function UsersContent({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  const tier = params.tier as "all" | "free" | "premium" | undefined;
  const status = params.status as "all" | "active" | "expired" | undefined;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  // Always fetch on server - React Query will cache for subsequent navigations
  const result = await getUsers({
    tier: tier === "all" ? undefined : tier,
    status: status === "all" ? undefined : status,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const initialData = result.data || null;

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

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}
