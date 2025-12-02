"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  UserDetail,
  StoreInfo,
  TransactionInfo,
} from "@/lib/db/services/admin-users.service";

interface UserDetailCardProps {
  user: UserDetail;
  isLoading?: boolean;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
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
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Get status badge styles
 */
function getStatusBadgeStyles(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
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
 * Loading skeleton for user detail card
 */
function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>

      {/* Subscription Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Stores Card */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* Transactions Card */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * User info section component
 */
function UserInfoSection({ user }: { user: UserDetail }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">User Information</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Registered</p>
          <p className="font-medium">{formatDate(user.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Login</p>
          <p className="font-medium">{formatDate(user.lastLogin)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-mono text-sm text-muted-foreground">{user.id}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Subscription info section component
 */
function SubscriptionInfoSection({ user }: { user: UserDetail }) {
  const usagePercentage =
    user.invoiceLimit > 0
      ? Math.round((user.currentMonthCount / user.invoiceLimit) * 100)
      : 0;
  const isOverLimit = user.currentMonthCount > user.invoiceLimit;

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Information</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Tier</p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-1",
              getTierBadgeStyles(user.tier)
            )}
          >
            {user.tier}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-1",
              getStatusBadgeStyles(user.subscriptionStatus)
            )}
          >
            {user.subscriptionStatus}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Invoice Usage (This Month)
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("font-medium", isOverLimit && "text-red-600")}>
              {user.currentMonthCount} / {user.invoiceLimit}
            </span>
            <span
              className={cn(
                "text-xs",
                isOverLimit
                  ? "text-red-600"
                  : usagePercentage > 80
                  ? "text-yellow-600"
                  : "text-muted-foreground"
              )}
            >
              ({usagePercentage}%)
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="font-medium">{user.invoiceCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Start Date</p>
          <p className="font-medium">
            {formatDate(user.subscriptionStartDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">End Date</p>
          <p className="font-medium">{formatDate(user.subscriptionEndDate)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stores list section component
 */
function StoresSection({ stores }: { stores: StoreInfo[] }) {
  if (stores.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Stores</h3>
        <p className="text-muted-foreground text-sm">No stores created yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Stores ({stores.length})</h3>
      <div className="space-y-3">
        {stores.map((store) => (
          <div
            key={store.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  store.isActive ? "bg-green-500" : "bg-gray-400"
                )}
              />
              <div>
                <p className="font-medium">{store.name}</p>
                <p className="text-xs text-muted-foreground">
                  {store.invoiceCount} invoices
                </p>
              </div>
            </div>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full",
                store.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              {store.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Transaction history section component
 */
function TransactionsSection({
  transactions,
}: {
  transactions: TransactionInfo[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <p className="text-muted-foreground text-sm">
          No payment transactions yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">
        Payment History ({transactions.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2 text-left text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-2 py-2 text-left text-sm font-medium text-muted-foreground">
                Tier
              </th>
              <th className="px-2 py-2 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-2 py-2 text-left text-sm font-medium text-muted-foreground">
                Method
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="px-2 py-3 text-sm">
                  {formatDate(tx.createdAt)}
                </td>
                <td className="px-2 py-3 text-sm font-medium">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      getTierBadgeStyles(tx.tier)
                    )}
                  >
                    {tx.tier}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      getStatusBadgeStyles(tx.status)
                    )}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-2 py-3 text-sm text-muted-foreground">
                  {tx.paymentMethod || "N/A"}
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
 * User detail card component
 * Displays comprehensive user information including subscription, stores, and transactions
 */
export function UserDetailCard({
  user,
  isLoading = false,
}: UserDetailCardProps) {
  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <UserInfoSection user={user} />
      <SubscriptionInfoSection user={user} />
      <StoresSection stores={user.stores} />
      <TransactionsSection transactions={user.transactions} />
    </div>
  );
}
