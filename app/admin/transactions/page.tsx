import { Suspense } from "react";
import { getTransactions } from "@/app/actions/admin";
import { TransactionFilters } from "@/components/features/admin/filters/transaction-filters";
import { TransactionsTableWrapper } from "@/components/features/admin/transactions-table-wrapper";
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
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

async function TransactionsContent({
  searchParams,
}: {
  searchParams: Awaited<TransactionsPageProps["searchParams"]>;
}) {
  const status = searchParams.status as
    | "all"
    | "pending"
    | "completed"
    | "failed"
    | undefined;
  const dateFrom = searchParams.dateFrom || "";
  const dateTo = searchParams.dateTo || "";
  const page = parseInt(searchParams.page || "1", 10);

  const result = await getTransactions({
    status: status === "all" ? undefined : status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const transactions = result.data?.transactions || [];
  const total = result.data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all payment transactions
        </p>
      </div>

      <TransactionFilters
        initialFilters={{
          status: status || "all",
          dateFrom,
          dateTo,
        }}
      />

      {result.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{result.error}</p>
        </div>
      )}

      <TransactionsTableWrapper
        transactions={transactions}
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />

      {!result.error && (
        <div className="text-sm text-muted-foreground">
          Showing {transactions.length} of {total} transactions
        </div>
      )}
    </div>
  );
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsContent searchParams={params} />
    </Suspense>
  );
}
