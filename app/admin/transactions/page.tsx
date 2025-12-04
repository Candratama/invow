import { Suspense } from "react";
import { getTransactions } from "@/app/actions/admin";
import { TransactionsClient } from "./transactions-client";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

interface TransactionsPageProps {
  searchParams: Promise<{
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

function TransactionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
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

async function TransactionsContent({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;

  const status = params.status as
    | "all"
    | "pending"
    | "completed"
    | "failed"
    | undefined;
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const page = parseInt(params.page || "1", 10);

  // Always fetch on server - React Query will cache for subsequent navigations
  const result = await getTransactions({
    status: status === "all" ? undefined : status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const initialData = result.data || null;

  return (
    <TransactionsClient
      initialData={initialData}
      filters={{
        status: status || "all",
        dateFrom,
        dateTo,
        page,
      }}
    />
  );
}

export default function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}
