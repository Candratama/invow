"use client";

import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { TransactionListItem } from "@/lib/db/services/admin-transactions.service";

interface TransactionsTableProps {
  transactions: TransactionListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowClick: (transaction: TransactionListItem) => void;
  onVerify: (transactionId: string) => void;
  isLoading?: boolean;
  isVerifying?: string | null;
}

/**
 * Format date to readable string
 */
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

/**
 * Format currency to IDR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get status badge styles and icon
 */
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

/**
 * Get tier badge styles
 */
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

/**
 * Loading skeleton for transactions table
 */
function TransactionsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
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
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-8 w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Transactions table component for admin payment transaction viewer
 * Displays transaction list with pagination, row click for detail modal,
 * and verify button for pending transactions
 * Shows warning indicator (yellow) for stale transactions (pending > 24h)
 */
export function TransactionsTable({
  transactions,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onRowClick,
  onVerify,
  isLoading = false,
  isVerifying = null,
}: TransactionsTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return <TransactionsTableSkeleton />;
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
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
                    onClick={() => onRowClick(transaction)}
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
                              onVerify(transaction.id);
                            }}
                            disabled={isVerifying === transaction.id}
                          >
                            {isVerifying === transaction.id ? "..." : "Verify"}
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
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
