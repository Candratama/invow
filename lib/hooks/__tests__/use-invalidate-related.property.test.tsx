/**
 * Property-Based Test: Mutation invalidates related caches
 *
 * **Feature: smooth-navigation-ux, Property 4: Mutation invalidates related caches**
 *
 * **Validates: Requirements 2.1, 2.4**
 *
 * Property: For any successful mutation (create/update/delete), the mutation's
 * onSuccess handler SHALL call invalidateQueries for all related query keys.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useInvalidateRelatedQueries } from "../use-invalidate-related";
import { dashboardKeys } from "../use-dashboard-data";
import { settingsKeys } from "../use-settings-data";
import { customersKeys } from "../use-customers-data";

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Spy on invalidateQueries
  const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient, invalidateQueriesSpy };
}

describe("Property 4: Mutation invalidates related caches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("afterInvoiceMutation invalidates dashboard revenue and invoices caches", () => {
    fc.assert(
      fc.property(
        fc.constant(true), // Simple property - verify the behavior
        () => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          // Trigger invoice mutation invalidation without storeId
          result.current.afterInvoiceMutation();

          // Property: invalidateQueries should be called for revenue and invoices
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);

          // Verify revenue query key invalidation
          const revenueCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.revenue())
          );
          expect(revenueCall).toBeDefined();

          // Verify invoices query key invalidation
          const invoicesCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.invoices())
          );
          expect(invoicesCall).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("afterInvoiceMutation with storeId also invalidates customers cache", () => {
    fc.assert(
      fc.property(
        fc.uuid(), // Generate random store IDs
        (storeId) => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          // Trigger invoice mutation invalidation with storeId
          result.current.afterInvoiceMutation(storeId);

          // Property: invalidateQueries should be called for revenue, invoices, AND customers
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);

          // Verify revenue query key invalidation
          const revenueCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.revenue())
          );
          expect(revenueCall).toBeDefined();

          // Verify invoices query key invalidation
          const invoicesCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.invoices())
          );
          expect(invoicesCall).toBeDefined();

          // Verify customers query key invalidation
          const customersCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(customersKeys.list(storeId))
          );
          expect(customersCall).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("afterSettingsMutation invalidates settings and dashboard revenue caches", () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const { wrapper, invalidateQueriesSpy } = createWrapper();

        const { result } = renderHook(() => useInvalidateRelatedQueries(), {
          wrapper,
        });

        // Trigger settings mutation invalidation
        result.current.afterSettingsMutation();

        // Property: invalidateQueries should be called for settings and dashboard revenue
        expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);

        // Verify settings query key invalidation (uses settingsKeys.all)
        const settingsCall = invalidateQueriesSpy.mock.calls.find(
          (call) =>
            JSON.stringify(call[0]?.queryKey) ===
            JSON.stringify(settingsKeys.all)
        );
        expect(settingsCall).toBeDefined();

        // Verify dashboard revenue query key invalidation
        const revenueCall = invalidateQueriesSpy.mock.calls.find(
          (call) =>
            JSON.stringify(call[0]?.queryKey) ===
            JSON.stringify(dashboardKeys.revenue())
        );
        expect(revenueCall).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("afterCustomerMutation invalidates customers list cache for specific storeId", () => {
    fc.assert(
      fc.property(
        // Generate random store IDs (UUIDs)
        fc.uuid(),
        (storeId) => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          // Trigger customer mutation invalidation
          result.current.afterCustomerMutation(storeId);

          // Property: invalidateQueries should be called once for customers list
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);

          // Verify customers query key includes the storeId
          const customersCall = invalidateQueriesSpy.mock.calls[0];
          expect(customersCall?.[0]?.queryKey).toEqual(
            customersKeys.list(storeId)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("invalidation callbacks are stable (memoized) across renders", () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const { wrapper } = createWrapper();

        const { result, rerender } = renderHook(
          () => useInvalidateRelatedQueries(),
          { wrapper }
        );

        const firstCallbacks = {
          afterInvoiceMutation: result.current.afterInvoiceMutation,
          afterSettingsMutation: result.current.afterSettingsMutation,
          afterCustomerMutation: result.current.afterCustomerMutation,
        };

        rerender();

        // Property: callbacks should be stable across renders
        expect(result.current.afterInvoiceMutation).toBe(
          firstCallbacks.afterInvoiceMutation
        );
        expect(result.current.afterSettingsMutation).toBe(
          firstCallbacks.afterSettingsMutation
        );
        expect(result.current.afterCustomerMutation).toBe(
          firstCallbacks.afterCustomerMutation
        );
      }),
      { numRuns: 100 }
    );
  });

  it("multiple sequential mutations invalidate correct caches independently", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.uuid(), fc.uuid(), fc.uuid()),
        ([invoiceStoreId, storeId1, storeId2]) => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          // Trigger multiple mutations in sequence
          result.current.afterInvoiceMutation(invoiceStoreId); // 3 calls (revenue + invoices + customers)
          result.current.afterSettingsMutation(); // 2 calls (settings.all + revenue)
          result.current.afterCustomerMutation(storeId1); // 1 call
          result.current.afterCustomerMutation(storeId2); // 1 call

          // Property: all invalidations should be called correctly
          // Invoice with storeId: 3 calls (revenue + invoices + customers)
          // Settings: 2 calls (settings.all + revenue)
          // Customer: 2 calls (one for each storeId)
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(7);

          // Verify customer invalidations for different storeIds
          const customerCalls = invalidateQueriesSpy.mock.calls.filter(
            (call) =>
              Array.isArray(call[0]?.queryKey) &&
              call[0]?.queryKey[0] === "customers"
          );
          // 3 customer invalidations: 1 from invoice mutation + 2 from customer mutations
          expect(customerCalls).toHaveLength(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
