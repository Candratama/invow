/**
 * Property-Based Test: Prefetch on hover populates cache
 *
 * **Feature: smooth-navigation-ux, Property 3: Prefetch on hover populates cache**
 *
 * **Validates: Requirements 1.3**
 *
 * Property: For any navigation link with prefetch handler, triggering mouseEnter
 * SHALL call queryClient.prefetchQuery with correct query key.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  usePrefetchDashboard,
  usePrefetchSettings,
  usePrefetchCustomers,
} from "../use-prefetch";
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

  // Spy on prefetchQuery
  const prefetchQuerySpy = vi.spyOn(queryClient, "prefetchQuery");

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient, prefetchQuerySpy };
}

describe("Property 3: Prefetch on hover populates cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usePrefetchDashboard calls prefetchQuery with correct query keys", () => {
    fc.assert(
      fc.property(
        fc.constant(true), // Simple property - just verify the behavior
        () => {
          const { wrapper, prefetchQuerySpy } = createWrapper();

          const { result } = renderHook(() => usePrefetchDashboard(), {
            wrapper,
          });

          // Trigger prefetch
          result.current();

          // Property: prefetchQuery should be called for revenue and invoices
          expect(prefetchQuerySpy).toHaveBeenCalledTimes(2);

          // Verify revenue query key
          const revenueCall = prefetchQuerySpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0].queryKey) ===
              JSON.stringify(dashboardKeys.revenue())
          );
          expect(revenueCall).toBeDefined();
          expect(revenueCall?.[0].staleTime).toBe(5 * 60 * 1000);

          // Verify invoices query key
          const invoicesCall = prefetchQuerySpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0].queryKey) ===
              JSON.stringify(dashboardKeys.invoices(1))
          );
          expect(invoicesCall).toBeDefined();
          expect(invoicesCall?.[0].staleTime).toBe(2 * 60 * 1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("usePrefetchSettings calls prefetchQuery with correct query key", () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const { wrapper, prefetchQuerySpy } = createWrapper();

        const { result } = renderHook(() => usePrefetchSettings(), { wrapper });

        // Trigger prefetch
        result.current();

        // Property: prefetchQuery should be called once for settings
        expect(prefetchQuerySpy).toHaveBeenCalledTimes(1);

        // Verify settings query key
        const settingsCall = prefetchQuerySpy.mock.calls[0];
        expect(settingsCall[0].queryKey).toEqual(settingsKeys.data());
        expect(settingsCall[0].staleTime).toBe(5 * 60 * 1000);
      }),
      { numRuns: 100 }
    );
  });

  it("usePrefetchCustomers calls prefetchQuery with correct query key when storeId provided", () => {
    fc.assert(
      fc.property(
        // Generate random store IDs (UUIDs)
        fc.uuid(),
        (storeId) => {
          const { wrapper, prefetchQuerySpy } = createWrapper();

          const { result } = renderHook(() => usePrefetchCustomers(storeId), {
            wrapper,
          });

          // Trigger prefetch
          result.current();

          // Property: prefetchQuery should be called once for customers
          expect(prefetchQuerySpy).toHaveBeenCalledTimes(1);

          // Verify customers query key includes the storeId
          const customersCall = prefetchQuerySpy.mock.calls[0];
          expect(customersCall[0].queryKey).toEqual(
            customersKeys.list(storeId)
          );
          expect(customersCall[0].staleTime).toBe(5 * 60 * 1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("usePrefetchCustomers does not call prefetchQuery when storeId is undefined", () => {
    fc.assert(
      fc.property(fc.constant(undefined), (storeId) => {
        const { wrapper, prefetchQuerySpy } = createWrapper();

        const { result } = renderHook(() => usePrefetchCustomers(storeId), {
          wrapper,
        });

        // Trigger prefetch
        result.current();

        // Property: prefetchQuery should NOT be called when storeId is undefined
        expect(prefetchQuerySpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it("prefetch callbacks are stable (memoized) across renders", () => {
    fc.assert(
      fc.property(fc.uuid(), (storeId) => {
        const { wrapper } = createWrapper();

        // Test dashboard prefetch stability
        const { result: dashboardResult, rerender: rerenderDashboard } =
          renderHook(() => usePrefetchDashboard(), { wrapper });
        const firstDashboardCallback = dashboardResult.current;
        rerenderDashboard();
        expect(dashboardResult.current).toBe(firstDashboardCallback);

        // Test settings prefetch stability
        const { result: settingsResult, rerender: rerenderSettings } =
          renderHook(() => usePrefetchSettings(), { wrapper });
        const firstSettingsCallback = settingsResult.current;
        rerenderSettings();
        expect(settingsResult.current).toBe(firstSettingsCallback);

        // Test customers prefetch stability (same storeId)
        const { result: customersResult, rerender: rerenderCustomers } =
          renderHook(() => usePrefetchCustomers(storeId), { wrapper });
        const firstCustomersCallback = customersResult.current;
        rerenderCustomers();
        expect(customersResult.current).toBe(firstCustomersCallback);
      }),
      { numRuns: 100 }
    );
  });

  it("usePrefetchCustomers callback changes when storeId changes", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
        ([storeId1, storeId2]) => {
          const { wrapper } = createWrapper();

          let currentStoreId = storeId1;
          const { result, rerender } = renderHook(
            () => usePrefetchCustomers(currentStoreId),
            { wrapper }
          );

          const firstCallback = result.current;

          // Change storeId
          currentStoreId = storeId2;
          rerender();

          // Property: callback should change when storeId changes
          expect(result.current).not.toBe(firstCallback);
        }
      ),
      { numRuns: 100 }
    );
  });
});
