"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

export interface PremiumStatus {
  isPremium: boolean;
  tier: string;
  isLoading: boolean;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
}

// Query keys for cache management
export const premiumStatusKeys = {
  all: ["premium-status"] as const,
  status: () => [...premiumStatusKeys.all, "status"] as const,
};

interface PremiumStatusData {
  isPremium: boolean;
  tier: string;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
}

/**
 * Hook for checking user's premium subscription status
 * Uses React Query for caching subscription status
 *
 * @returns PremiumStatus object with isPremium, tier, isLoading, expiresAt, daysUntilExpiry, and isExpiringSoon
 */
export function usePremiumStatus(initialData?: PremiumStatusData): PremiumStatus {
  const queryClient = useQueryClient();
  
  // Check if we already have cached data - don't overwrite with initialData
  const existingData = queryClient.getQueryData<PremiumStatusData>(premiumStatusKeys.status());
  
  // Only use initialData on first mount when no cache exists
  const initialDataRef = useRef(existingData ? undefined : initialData);
  
  const { data, isLoading } = useQuery({
    queryKey: premiumStatusKeys.status(),
    queryFn: async (): Promise<PremiumStatusData> => {
      // Import dynamically to avoid server-only module in client
      const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
      const result = await getSubscriptionStatusAction();

      if (result.error || !result.data) {
        // Default to free tier on error
        return {
          isPremium: false,
          tier: "free",
          expiresAt: null,
          daysUntilExpiry: null,
          isExpiringSoon: false,
        };
      }

      // Extract expiry date from resetDate for premium users
      const expiresAt = result.data.tier === 'premium' && result.data.resetDate
        ? new Date(result.data.resetDate)
        : null;

      // Calculate days until expiry
      const daysUntilExpiry = expiresAt
        ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      // Check if expiring soon (within 7 days)
      const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

      return {
        isPremium: result.data.tier === "premium",
        tier: result.data.tier,
        expiresAt,
        daysUntilExpiry,
        isExpiringSoon,
      };
    },
    // Only use initialData if no cache exists
    initialData: initialDataRef.current,
    staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  return {
    isPremium: data?.isPremium ?? false,
    tier: data?.tier ?? "free",
    isLoading,
    expiresAt: data?.expiresAt ?? null,
    daysUntilExpiry: data?.daysUntilExpiry ?? null,
    isExpiringSoon: data?.isExpiringSoon ?? false,
  };
}

/**
 * Hook to invalidate premium status cache
 * Call this after subscription changes (upgrade/downgrade)
 */
export function useInvalidatePremiumStatus() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: premiumStatusKeys.all });
  };
}
