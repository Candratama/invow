"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    // Only use initialData if provided (first load from server)
    // On client navigation, React Query will use cached data
    initialData,
    staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
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
