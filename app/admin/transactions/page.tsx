"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTransactions, verifyTransaction } from "@/app/actions/admin";
import {
  TransactionFilters,
  type TransactionFiltersState,
} from "@/components/features/admin/filters/transaction-filters";
import { TransactionsTable } from "@/components/features/admin/transactions-table";
import { TransactionDetailModal } from "@/components/features/admin/transaction-detail-modal";
import type { TransactionListItem } from "@/lib/db/services/admin-transactions.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_SIZE = 10;

function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<TransactionFiltersState>({
    status:
      (searchParams.get("status") as TransactionFiltersState["status"]) ||
      "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Modal state
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: TransactionFiltersState, page: number) => {
      const params = new URLSearchParams();
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
      if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);
      if (page > 1) params.set("page", page.toString());

      const queryString = params.toString();
      router.push(
        `/admin/transactions${queryString ? `?${queryString}` : ""}`,
        { scroll: false }
      );
    },
    [router]
  );

  // Fetch transactions data
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTransactions({
        status: filters.status === "all" ? undefined : filters.status,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      if (!result.success || !result.data) {
        setError(result.error || "Failed to fetch transactions");
        setTransactions([]);
        setTotal(0);
      } else {
        setTransactions(result.data.transactions);
        setTotal(result.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setTransactions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  // Fetch transactions when filters or page changes
  useEffect(() => {
    startTransition(() => {
      fetchTransactions();
    });
  }, [fetchTransactions]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: TransactionFiltersState) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page on filter change
      updateUrl(newFilters, 1);
    },
    [updateUrl]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateUrl(filters, page);
    },
    [filters, updateUrl]
  );

  // Handle row click to open detail modal
  const handleRowClick = useCallback((transaction: TransactionListItem) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  }, []);

  // Handle verify transaction
  const handleVerify = useCallback(
    async (transactionId: string) => {
      setIsVerifying(transactionId);
      try {
        const result = await verifyTransaction(transactionId);
        if (result.success) {
          toast.success("Transaction verified successfully");
          // Refresh the list
          fetchTransactions();
        } else {
          toast.error(result.error || "Failed to verify transaction");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsVerifying(null);
      }
    },
    [fetchTransactions]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all payment transactions
        </p>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        total={total}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onVerify={handleVerify}
        isLoading={isLoading || isPending}
        isVerifying={isVerifying}
      />

      {/* Results Summary */}
      {!isLoading && !error && (
        <div className="text-sm text-muted-foreground">
          Showing {transactions.length} of {total} transactions
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
