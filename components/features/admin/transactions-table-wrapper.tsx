"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { TransactionDetailModal } from "@/components/features/admin/transaction-detail-modal";
import { verifyTransaction } from "@/app/actions/admin";
import { toast } from "sonner";
import type { TransactionListItem } from "@/lib/db/services/admin-transactions.service";

interface TransactionsTableWrapperProps {
  transactions: TransactionListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusInfo(status: string): {
  styles: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "completed":
      return {
        styles: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      };
    case "pending":
      return {
        styles: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      };
    case "failed":
      return {
        styles: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      };
    default:
      return {
        styles: "bg-gray-100 text-gray-800",
        icon: null,
      };
  }
}

function getTierBadgeStyles(tier: string): string {
  switch (tier) {
    case "premium":
      return "bg-purple-100 text-purple-800";
    case "free":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function TransactionsTableWrapper({
  transactions,
  total,
  currentPage,
  pageSize,
}: TransactionsTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/admin/transactions?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  const handleRowClick = useCallback((transaction: TransactionListItem) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  }, []);

  const handleVerify = useCallback(
    async (transactionId: string) => {
      setIsVerifying(transactionId);
      try {
        const result = await verifyTransaction(transactionId);
        if (result.success) {
          toast.success("Transaction verified successfully");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to verify transaction");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsVerifying(null);
      }
    },
    [router]
  );

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div
          className={cn(
            "rounded-lg border bg-card",
            isPending && "opacity-60 pointer-events-none"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const statusInfo = getStatusInfo(transaction.status);
                  return (
                    <tr
                      key={transaction.id}
                      onClick={() => handleRowClick(transaction)}
                      className={cn(
                        "border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                        transaction.isStale && "bg-yellow-50/50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {transaction.userEmail}
                          </span>
                          {transaction.isStale && (
                            <span title="Stale transaction (pending > 24h)">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </span>
                          )}
                          {transaction.verifiedAt && (
                            <span
                              title={`Verified at ${formatDate(
                                transaction.verifiedAt
                              )}`}
                            >
                              <ShieldCheck className="h-4 w-4 text-green-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            getTierBadgeStyles(transaction.tier)
                          )}
                        >
                          {transaction.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            statusInfo.styles
                          )}
                        >
                          {statusInfo.icon}
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {transaction.paymentMethod || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(transaction.completedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {transaction.status === "pending" &&
                          !transaction.verifiedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerify(transaction.id);
                              }}
                              disabled={isVerifying === transaction.id}
                            >
                              {isVerifying === transaction.id
                                ? "..."
                                : "Verify"}
                            </Button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTransaction}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
