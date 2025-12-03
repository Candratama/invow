"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys untuk cache management
export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
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
}

/**
 * Hook untuk fetch dashboard data dengan React Query caching
 * Data akan di-cache dan tidak refetch saat navigasi
 */
export function useDashboardData(initialData?: DashboardData) {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: async () => {
      // Import dynamically to avoid server-only module in client
      const { getDashboardDataAction } = await import(
        "@/app/actions/dashboard"
      );
      const result = await getDashboardDataAction();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }
      return result.data as DashboardData;
    },
    // Gunakan initial data dari server jika ada
    initialData,
    // Data dianggap fresh selama 5 menit
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook untuk invalidate dashboard cache
 * Panggil setelah mutation (create/update/delete invoice)
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}
