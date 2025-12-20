"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/lib/db/database.types";

// Query keys for cache management
export const customersKeys = {
  all: ["customers"] as const,
  list: (storeId: string) => [...customersKeys.all, "list", storeId] as const,
  search: (storeId: string, query: string) => [...customersKeys.all, "search", storeId, query] as const,
  detail: (id: string) => [...customersKeys.all, "detail", id] as const,
};

/**
 * Hook for fetching customers list with React Query caching
 */
export function useCustomers(storeId: string | undefined, initialData?: Customer[]) {
  const queryClient = useQueryClient();
  
  const existingData = storeId 
    ? queryClient.getQueryData<Customer[]>(customersKeys.list(storeId))
    : undefined;
  
  const initialDataRef = useRef(existingData ? undefined : initialData);
  
  return useQuery({
    queryKey: storeId ? customersKeys.list(storeId) : ["customers", "disabled"],
    queryFn: async () => {
      if (!storeId) return [];
      const { getCustomersAction } = await import("@/app/actions/customers");
      const result = await getCustomersAction(storeId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch customers");
      }
      return result.data as Customer[];
    },
    initialData: initialDataRef.current,
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Use true instead of false - this will refetch on mount only when data is stale
    // This ensures invalidated data gets refetched when navigating to the page
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for searching customers
 */
export function useSearchCustomers(storeId: string | undefined, query: string) {
  return useQuery({
    queryKey: storeId ? customersKeys.search(storeId, query) : ["customers", "search", "disabled"],
    queryFn: async () => {
      if (!storeId) return [];
      const { searchCustomersAction } = await import("@/app/actions/customers");
      const result = await searchCustomersAction(storeId, query);
      if (!result.success) {
        throw new Error(result.error || "Failed to search customers");
      }
      return result.data as Customer[];
    },
    enabled: !!storeId && query.length > 0,
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 60 * 1000, // Keep in cache for 1 minute
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for creating a customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CustomerInsert) => {
      const { createCustomerAction } = await import("@/app/actions/customers");
      const result = await createCustomerAction(data);
      if (!result.success) {
        throw new Error(result.error || "Failed to create customer");
      }
      return result.data as Customer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(variables.store_id) });
    },
  });
}

/**
 * Hook for updating a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data, storeId }: { id: string; data: CustomerUpdate; storeId: string }) => {
      const { updateCustomerAction } = await import("@/app/actions/customers");
      const result = await updateCustomerAction(id, data);
      if (!result.success) {
        throw new Error(result.error || "Failed to update customer");
      }
      return { customer: result.data as Customer, storeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(result.storeId) });
      queryClient.invalidateQueries({ queryKey: customersKeys.detail(result.customer.id) });
    },
  });
}

/**
 * Hook for deleting a customer (soft delete)
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { deleteCustomerAction } = await import("@/app/actions/customers");
      const result = await deleteCustomerAction(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete customer");
      }
      return { id, storeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(result.storeId) });
    },
  });
}

/**
 * Hook to invalidate customers cache
 */
export function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  
  return (storeId?: string) => {
    if (storeId) {
      queryClient.invalidateQueries({ queryKey: customersKeys.list(storeId) });
    } else {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
    }
  };
}
