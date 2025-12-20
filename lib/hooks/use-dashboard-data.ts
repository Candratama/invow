"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

// Query keys untuk cache management
export const dashboardKeys = {
  all: ["dashboard"] as const,
  revenue: () => [...dashboardKeys.all, "revenue"] as const,
  invoices: (page?: number) =>
    [...dashboardKeys.all, "invoices", page || 1] as const,
  data: (page?: number) =>
    [...dashboardKeys.all, "data", page || 1] as const,
};

export interface DashboardData {
  invoices: unknown[];
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    invoiceCount: number;
    monthlyInvoiceCount: number;
    averageOrderValue: number;
    monthlyAverageOrderValue: number;
  } | null;
  subscriptionStatus: {
    tier: string;
    invoiceLimit: number;
    remainingInvoices: number;
    currentMonthCount: number;
    monthYear: string;
    resetDate: string | null;
  } | null;
  storeSettings: unknown | null;
  defaultStore: { id: string } | null;
  totalPages: number;
  hasMoreHistory: boolean;
  historyLimitMessage?: string;
  userPreferences?: {
    selectedTemplate: string;
    taxEnabled: boolean;
    taxPercentage: number;
  };
}

/**
 * Hook untuk fetch dashboard data dengan React Query caching
 * Data akan di-cache dan tidak refetch saat navigasi
 */
export function useDashboardData(
  page: number = 1,
  initialData?: DashboardData
) {
  return useQuery({
    queryKey: dashboardKeys.data(page),
    queryFn: async () => {
      // Import dynamically to avoid server-only module in client
      const { getDashboardDataAction } = await import(
        "@/app/actions/dashboard"
      );
      const result = await getDashboardDataAction(page);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
      return result.data as DashboardData;
    },
    // Gunakan initial data dari server jika ada (hanya untuk page 1)
    initialData: page === 1 ? initialData : undefined,
    // Data dianggap fresh selama 5 menit
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}

/**
 * Hook untuk fetch revenue data saja (tidak berubah saat pagination)
 */
export function useRevenueData(initialData?: DashboardData) {
  const queryClient = useQueryClient();
  
  // Check if we already have cached data - don't overwrite with initialData
  const existingData = queryClient.getQueryData<{
    revenueMetrics: DashboardData["revenueMetrics"];
    subscriptionStatus: DashboardData["subscriptionStatus"];
    storeSettings: unknown;
    defaultStore: { id: string } | null;
    userPreferences: DashboardData["userPreferences"];
  }>(dashboardKeys.revenue());
  
  // Only use initialData on first mount when no cache exists
  const initialDataRef = useRef(
    existingData
      ? undefined
      : initialData
      ? {
          revenueMetrics: initialData.revenueMetrics,
          subscriptionStatus: initialData.subscriptionStatus,
          storeSettings: initialData.storeSettings,
          defaultStore: initialData.defaultStore,
          userPreferences: initialData.userPreferences,
        }
      : undefined
  );
  
  return useQuery<{
    revenueMetrics: DashboardData["revenueMetrics"];
    subscriptionStatus: DashboardData["subscriptionStatus"];
    storeSettings: unknown;
    defaultStore: { id: string } | null;
    userPreferences: DashboardData["userPreferences"];
  }>({
    queryKey: dashboardKeys.revenue(),
    queryFn: async () => {
      const { getDashboardDataAction } = await import(
        "@/app/actions/dashboard"
      );
      const result = await getDashboardDataAction(1);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch revenue data");
      }
      return {
        revenueMetrics: result.data?.revenueMetrics || null,
        subscriptionStatus: result.data?.subscriptionStatus || null,
        storeSettings: result.data?.storeSettings || null,
        defaultStore: result.data?.defaultStore || null,
        userPreferences: result.data?.userPreferences,
      };
    },
    initialData: initialDataRef.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook untuk fetch invoice list saja (berubah saat pagination)
 */
export function useInvoiceList(page: number = 1, initialData?: DashboardData) {
  const queryClient = useQueryClient();
  
  // Check if we already have cached data for this page
  const existingData = queryClient.getQueryData<{
    invoices: unknown[];
    totalPages: number;
    hasMoreHistory: boolean;
    historyLimitMessage?: string;
  }>(dashboardKeys.invoices(page));
  
  // Only use initialData on first mount when no cache exists (page 1 only)
  const initialDataRef = useRef(
    existingData
      ? undefined
      : page === 1 && initialData
      ? {
          invoices: initialData.invoices,
          totalPages: initialData.totalPages,
          hasMoreHistory: initialData.hasMoreHistory,
          historyLimitMessage: initialData.historyLimitMessage,
        }
      : undefined
  );
  
  return useQuery<{
    invoices: unknown[];
    totalPages: number;
    hasMoreHistory: boolean;
    historyLimitMessage?: string;
  }>({
    queryKey: dashboardKeys.invoices(page),
    queryFn: async () => {
      const { getDashboardDataAction } = await import(
        "@/app/actions/dashboard"
      );
      const result = await getDashboardDataAction(page);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch invoices");
      }
      return {
        invoices: result.data?.invoices || [],
        totalPages: result.data?.totalPages || 1,
        hasMoreHistory: result.data?.hasMoreHistory || false,
        historyLimitMessage: result.data?.historyLimitMessage,
      };
    },
    initialData: initialDataRef.current,
    staleTime: 2 * 60 * 1000, // 2 minutes for invoice list
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook untuk invalidate dashboard cache
 * Panggil setelah mutation (create/update/delete invoice)
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate both revenue and invoices
    queryClient.invalidateQueries({ queryKey: dashboardKeys.revenue() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.invoices() });
  };
}
