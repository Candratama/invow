import { unstable_cache } from "next/cache";
import "server-only";
import {
  getUsers as getUsersService,
  getUserDetail as getUserDetailService,
  type UserFilters,
  type UserListItem,
  type UserDetail,
} from "@/lib/db/services/admin-users.service";
import {
  getSubscriptions as getSubscriptionsService,
  type SubscriptionFilters,
  type SubscriptionListItem,
} from "@/lib/db/services/admin-subscriptions.service";
import {
  getTransactions as getTransactionsService,
  type TransactionFilters,
  type TransactionListItem,
} from "@/lib/db/services/admin-transactions.service";
import {
  getDashboardMetrics as getDashboardMetricsService,
  getRecentTransactions as getRecentTransactionsService,
  type DashboardMetrics,
  type TransactionListItem as RecentTransactionItem,
} from "@/lib/db/services/admin-metrics.service";

/**
 * Cache tags for admin data
 */
export const ADMIN_CACHE_TAGS = {
  users: "admin-users",
  subscriptions: "admin-subscriptions",
  transactions: "admin-transactions",
  metrics: "admin-metrics",
} as const;

/**
 * Cache revalidation time in seconds (60 seconds)
 */
const CACHE_REVALIDATE = 60;

/**
 * Generate cache key from filters
 */
function generateCacheKey(prefix: string, filters: object): string[] {
  const filterStr = JSON.stringify(filters);
  return [prefix, filterStr];
}

/**
 * Get cached admin users list
 */
export async function getAdminUsers(filters: UserFilters = {}): Promise<{
  data: { users: UserListItem[]; total: number } | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getUsersService(filters),
    generateCacheKey("admin-users-list", filters),
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.users],
    }
  );
  return cachedFn();
}

/**
 * Get cached admin user detail
 */
export async function getAdminUserDetail(userId: string): Promise<{
  data: UserDetail | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getUserDetailService(userId),
    ["admin-user-detail", userId],
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.users],
    }
  );
  return cachedFn();
}

/**
 * Get cached admin subscriptions list
 */
export async function getAdminSubscriptions(filters: SubscriptionFilters = {}): Promise<{
  data: { subscriptions: SubscriptionListItem[]; total: number } | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getSubscriptionsService(filters),
    generateCacheKey("admin-subscriptions-list", filters),
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.subscriptions],
    }
  );
  return cachedFn();
}

/**
 * Get cached admin transactions list
 */
export async function getAdminTransactions(filters: TransactionFilters = {}): Promise<{
  data: { transactions: TransactionListItem[]; total: number } | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getTransactionsService(filters),
    generateCacheKey("admin-transactions-list", filters),
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.transactions],
    }
  );
  return cachedFn();
}

/**
 * Get cached admin dashboard metrics
 */
export async function getAdminDashboardMetrics(): Promise<{
  data: DashboardMetrics | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getDashboardMetricsService(),
    ["admin-dashboard-metrics"],
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.metrics],
    }
  );
  return cachedFn();
}

/**
 * Get cached admin recent transactions
 */
export async function getAdminRecentTransactions(limit: number = 10): Promise<{
  data: RecentTransactionItem[] | null;
  error: Error | null;
}> {
  const cachedFn = unstable_cache(
    async () => getRecentTransactionsService(limit),
    ["admin-recent-transactions", String(limit)],
    {
      revalidate: CACHE_REVALIDATE,
      tags: [ADMIN_CACHE_TAGS.transactions],
    }
  );
  return cachedFn();
}

// Re-export types
export type {
  UserFilters,
  UserListItem,
  UserDetail,
  SubscriptionFilters,
  SubscriptionListItem,
  TransactionFilters,
  TransactionListItem,
  DashboardMetrics,
  RecentTransactionItem,
};
