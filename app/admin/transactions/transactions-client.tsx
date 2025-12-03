"use client";

import { TransactionFilters } from "@/components/features/admin/filters/transaction-filters";
import { TransactionsTableWrapper } from "@/components/features/admin/transactions-table-wrapper";
import { useAdminTransactions } from "@/lib/hooks/use-admin-data";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionListItem } from "@/lib/db/services/admin-transactions.service";

const PAGE_SIZE = 10;

interface TransactionsClientProps {
  initialData: {
    transactions: unknown[];
    total: number;
  } | null;
  filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
    page: number;
  };
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

export function TransactionsClient({
  initialData,
  filters,
}: TransactionsClientProps) {
  const { data, isLoading, error } = useAdminTransactions(
    {
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page,
      pageSize: PAGE_SIZE,
    },
    initialData || undefined
  );

  const transactions = (data?.transactions || []) as TransactionListItem[];
  const total = data?.total || 0;

  if (isLoading && !initialData) {
    return <TransactionsPageSkeleton />;
  }

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
          status: (filters.status || "all") as
            | "all"
            | "pending"
            | "completed"
            | "failed",
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error instanceof Error
              ? error.message
              : "Failed to load transactions"}
          </p>
        </div>
      )}

      <TransactionsTableWrapper
        transactions={transactions}
        total={total}
        currentPage={filters.page}
        pageSize={PAGE_SIZE}
      />

      {!error && (
        <div className="text-sm text-muted-foreground">
          Showing {transactions.length} of {total} transactions
        </div>
      )}
    </div>
  );
}
