"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock } from "lucide-react";
import type { SubscriptionListItem } from "@/lib/db/services/admin-subscriptions.service";

interface SubscriptionsTableProps {
  subscriptions: SubscriptionListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
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
  });
}

/**
 * Get status badge styles
 */
function getStatusBadgeStyles(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expiring_soon":
      return "bg-yellow-100 text-yellow-800";
    case "expired":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
 * Format status for display
 */
function formatStatus(status: string): string {
  switch (status) {
    case "expiring_soon":
      return "Expiring Soon";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Loading skeleton for subscriptions table
 */
function SubscriptionsTableSkeleton({ rows = 5 }: { rows?: number }) {
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
                Tier
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Usage
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
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
 * Subscriptions table component for admin subscription management
 * Displays subscription list with pagination and row click navigation
 * Shows warning indicators for expiring_soon and limit_exceeded subscriptions
 */
export function SubscriptionsTable({
  subscriptions,
  total,
  currentPage,
  pageSize,
  onPageChange,
  isLoading = false,
}: SubscriptionsTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  if (isLoading) {
    return <SubscriptionsTableSkeleton />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No subscriptions found</p>
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
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  onClick={() => handleRowClick(subscription.userId)}
                  className={cn(
                    "border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                    subscription.status === "expiring_soon" &&
                      "bg-yellow-50/50",
                    subscription.limitExceeded && "bg-red-50/50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {subscription.userEmail}
                      </span>
                      {subscription.limitExceeded && (
                        <span title="Invoice limit exceeded">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </span>
                      )}
                      {subscription.status === "expiring_soon" &&
                        !subscription.limitExceeded && (
                          <span title="Expiring soon">
                            <Clock className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getTierBadgeStyles(subscription.tier)
                      )}
                    >
                      {subscription.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm",
                        subscription.limitExceeded
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {subscription.currentMonthCount} /{" "}
                      {subscription.invoiceLimit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(subscription.startDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(subscription.endDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        getStatusBadgeStyles(subscription.status)
                      )}
                    >
                      {formatStatus(subscription.status)}
                    </span>
                  </td>
                </tr>
              ))}
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
