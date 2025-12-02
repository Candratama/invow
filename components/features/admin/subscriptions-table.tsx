"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { AlertTriangle, Clock } from "lucide-react";
import type { SubscriptionListItem } from "@/lib/db/services/admin-subscriptions.service";

interface SubscriptionsTableProps {
  subscriptions: SubscriptionListItem[];
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
  });
}

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

function formatStatus(status: string): string {
  switch (status) {
    case "expiring_soon":
      return "Expiring Soon";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function SubscriptionsTable({
  subscriptions,
  total,
  currentPage,
  pageSize,
}: SubscriptionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
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
        router.push(`/admin/subscriptions?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, searchParams]
  );

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No subscriptions found</p>
      </div>
    );
  }

  return (
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
                  className={cn(
                    "border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                    subscription.status === "expiring_soon" &&
                      "bg-yellow-50/50",
                    subscription.limitExceeded && "bg-red-50/50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${subscription.userId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {subscription.userEmail}
                      </Link>
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
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
