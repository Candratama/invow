"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { SettingsPageData } from "@/lib/db/data-access/settings";

// Query keys untuk cache management
export const settingsKeys = {
  all: ["settings"] as const,
  data: () => [...settingsKeys.all, "data"] as const,
};

/**
 * Hook untuk fetch settings data dengan React Query caching
 * Data di-fetch dari server dan di-cache di client
 */
export function useSettingsData(initialData?: SettingsPageData) {
  const queryClient = useQueryClient();
  
  // Check if we already have cached data - don't overwrite with initialData
  const existingData = queryClient.getQueryData<SettingsPageData>(settingsKeys.data());
  
  // Only use initialData on first mount when no cache exists
  const initialDataRef = useRef(existingData ? undefined : initialData);
  
  return useQuery({
    queryKey: settingsKeys.data(),
    queryFn: async () => {
      // Import dynamically to avoid server-only module in client
      const { getSettingsDataAction } = await import("@/app/actions/settings");
      const result = await getSettingsDataAction();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch settings data");
      }
      return result.data as SettingsPageData;
    },
    // Only use initialData if no cache exists.
    // The settings payload is persisted to localStorage, so we keep
    // serving cached data on mount (instant render) but always re-verify
    // against the server. Otherwise a returning user can land on a stale
    // tier / store snapshot from before they upgraded in another tab.
    initialData: initialDataRef.current,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook untuk invalidate settings cache
 */
export function useInvalidateSettings() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.all });
  };
}
