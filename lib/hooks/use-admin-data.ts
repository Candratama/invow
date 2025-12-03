"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys untuk admin cache management
export const adminKeys = {
  all: ["admin"] as const,
  users: (filters?: object) => [...adminKeys.all, "users", filters] as const,
  stores: (filters?: object) => [...adminKeys.all, "stores", filters] as const,
  transactions: (filters?: object) =>
    [...adminKeys.all, "transactions", filters] as const,
  subscriptions: (filters?: object) =>
    [...adminKeys.all, "subscriptions", filters] as const,
  invoices: (filters?: object) =>
    [...adminKeys.all, "invoices", filters] as const,
  analytics: (filters?: object) =>
    [...adminKeys.all, "analytics", filters] as const,
};

interface UseAdminUsersParams {
  tier?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseAdminStoresParams {
  userId?: string;
  isActive?: boolean | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

interface UseAdminTransactionsParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook untuk fetch admin users dengan caching
 */
export function useAdminUsers<T>(
  params: UseAdminUsersParams,
  initialData?: T
) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: async () => {
      const { getUsers } = await import("@/app/actions/admin");
      const result = await getUsers({
        tier: params.tier === "all" ? undefined : (params.tier as "free" | "premium"),
        status: params.status === "all" ? undefined : (params.status as "active" | "expired"),
        search: params.search || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      });
      if (result.error) throw new Error(result.error);
      return result.data as T;
    },
    initialData,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
  });
}

/**
 * Hook untuk fetch admin stores dengan caching
 */
export function useAdminStores<T>(
  params: UseAdminStoresParams,
  initialData?: T
) {
  return useQuery({
    queryKey: adminKeys.stores(params),
    queryFn: async () => {
      const { getAdminStores } = await import("@/app/actions/admin-stores");
      const result = await getAdminStores({
        userId: params.userId || undefined,
        isActive: params.isActive === "all" ? undefined : params.isActive,
        search: params.search || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      });
      if (result.error) throw new Error(result.error);
      return result.data as T;
    },
    initialData,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook untuk fetch admin transactions dengan caching
 */
export function useAdminTransactions<T>(
  params: UseAdminTransactionsParams,
  initialData?: T
) {
  return useQuery({
    queryKey: adminKeys.transactions(params),
    queryFn: async () => {
      const { getTransactions } = await import("@/app/actions/admin");
      const result = await getTransactions({
        status:
          params.status === "all"
            ? undefined
            : (params.status as "pending" | "completed" | "failed"),
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      });
      if (result.error) throw new Error(result.error);
      return result.data as T;
    },
    initialData,
    staleTime: 2 * 60 * 1000,
  });
}

interface UseAdminInvoicesParams {
  userId?: string;
  storeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook untuk fetch admin invoices dengan caching
 */
export function useAdminInvoices<T>(
  params: UseAdminInvoicesParams,
  initialData?: T
) {
  return useQuery({
    queryKey: adminKeys.invoices(params),
    queryFn: async () => {
      const { getAdminInvoices } = await import("@/app/actions/admin-invoices");
      const result = await getAdminInvoices({
        userId: params.userId || undefined,
        storeId: params.storeId || undefined,
        status:
          params.status === "all"
            ? undefined
            : (params.status as "draft" | "pending" | "synced"),
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
        search: params.search || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      });
      if (result.error) throw new Error(result.error);
      return result.data as T;
    },
    initialData,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook untuk invalidate semua admin cache
 */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    invalidateUsers: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    invalidateStores: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
    invalidateTransactions: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
  };
}
