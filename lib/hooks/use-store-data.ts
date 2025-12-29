"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

export const storeKeys = {
  all: ["store"] as const,
  data: () => [...storeKeys.all, "data"] as const,
};

interface StoreData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  store_description: string | null;
  tagline: string | null;
  store_number: string | null;
  payment_method: string | null;
  brand_color: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
}

export function useStoreData(initialData?: StoreData) {
  const queryClient = useQueryClient();
  
  const existingData = queryClient.getQueryData<StoreData>(storeKeys.data());
  const initialDataRef = useRef(existingData ? undefined : initialData);
  
  const query = useQuery({
    queryKey: storeKeys.data(),
    queryFn: async (): Promise<StoreData | null> => {
      const { getStoreAction } = await import("@/app/actions/store");
      const result = await getStoreAction();
      
      if (!result.success || !result.data) {
        return null;
      }
      
      return result.data as StoreData;
    },
    initialData: initialDataRef.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    store: query.data ?? null,
    storeId: query.data?.id ?? null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStoreId() {
  const { storeId, isLoading } = useStoreData();
  
  return {
    storeId,
    isLoading,
  };
}

export function useInvalidateStore() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: storeKeys.all });
  };
}
