"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./use-dashboard-data";
import { settingsKeys } from "./use-settings-data";
import { customersKeys } from "./use-customers-data";
import { reportKeys } from "./use-report-data";

/**
 * Hook to prefetch dashboard data on hover/focus
 * Enables instant navigation to dashboard page
 * 
 * @returns Callback function to trigger prefetch
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    // Prefetch revenue data (main dashboard data)
    queryClient.prefetchQuery({
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
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch first page of invoices
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.invoices(1),
      queryFn: async () => {
        const { getDashboardDataAction } = await import(
          "@/app/actions/dashboard"
        );
        const result = await getDashboardDataAction(1);
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
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);
}

/**
 * Hook to prefetch settings data on hover/focus
 * Enables instant navigation to settings page
 * 
 * @returns Callback function to trigger prefetch
 */
export function usePrefetchSettings() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: settingsKeys.data(),
      queryFn: async () => {
        const { getSettingsDataAction } = await import(
          "@/app/actions/settings"
        );
        const result = await getSettingsDataAction();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch settings data");
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}

/**
 * Hook to prefetch customers data on hover/focus
 * Enables instant navigation to customers page
 * 
 * @param storeId - The store ID to fetch customers for
 * @returns Callback function to trigger prefetch
 */
export function usePrefetchCustomers(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!storeId) return;

    queryClient.prefetchQuery({
      queryKey: customersKeys.list(storeId),
      queryFn: async () => {
        const { getCustomersAction } = await import(
          "@/app/actions/customers"
        );
        const result = await getCustomersAction(storeId);
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch customers");
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, storeId]);
}

/**
 * Hook to prefetch report data on hover/focus
 * Enables instant navigation to report page
 *
 * @returns Callback function to trigger prefetch
 */
export function usePrefetchReport() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    // Default date range: last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };

    // Prefetch overview data
    queryClient.prefetchQuery({
      queryKey: reportKeys.overview(dateRange),
      queryFn: async () => {
        const { getReportOverviewAction } = await import(
          "@/app/actions/report"
        );
        const result = await getReportOverviewAction(dateRange);
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch report overview");
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch buyback data
    queryClient.prefetchQuery({
      queryKey: reportKeys.buyback(dateRange),
      queryFn: async () => {
        const { getReportBuybackAction } = await import(
          "@/app/actions/report"
        );
        const result = await getReportBuybackAction(dateRange);
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch report buyback");
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
