"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { dashboardKeys } from "./use-dashboard-data";
import { settingsKeys } from "./use-settings-data";
import { customersKeys } from "./use-customers-data";

/**
 * Hook for cross-query invalidation after mutations.
 * Ensures related caches are invalidated when data changes.
 * 
 * Requirements: 2.1, 2.4
 * - WHEN a user creates, updates, or deletes data THEN the System SHALL invalidate relevant caches immediately
 * - WHEN a mutation succeeds THEN the System SHALL update all related cached queries across pages
 */
export function useInvalidateRelatedQueries() {
  const queryClient = useQueryClient();

  /**
   * Invalidate after invoice mutation (create/update/delete)
   * Invalidates: dashboard revenue, dashboard invoices, and customers (since new customer may be created)
   */
  const afterInvoiceMutation = useCallback((storeId?: string) => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.revenue() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.invoices() });
    // Also invalidate customers cache since invoice creation may create a new customer
    if (storeId) {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(storeId) });
    }
  }, [queryClient]);

  /**
   * Invalidate after settings mutation (store info, preferences)
   * Invalidates: settings data, dashboard revenue (for store info display)
   */
  const afterSettingsMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    // Dashboard shows store info in revenue cards, so invalidate that too
    queryClient.invalidateQueries({ queryKey: dashboardKeys.revenue() });
  }, [queryClient]);

  /**
   * Invalidate after customer mutation (create/update/delete)
   * Invalidates: customers list for the specific store
   */
  const afterCustomerMutation = useCallback(
    (storeId: string) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(storeId) });
    },
    [queryClient]
  );

  return {
    afterInvoiceMutation,
    afterSettingsMutation,
    afterCustomerMutation,
  };
}
