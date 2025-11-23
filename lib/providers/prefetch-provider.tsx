"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { storeSettingsQueryKey } from "@/lib/hooks/use-store-settings";
import { userPreferencesQueryKey } from "@/lib/hooks/use-user-preferences";
import { defaultStoreQueryKey } from "@/lib/hooks/use-default-store";
import { storesService, userPreferencesService } from "@/lib/db/services";
import type { StoreSettings } from "@/lib/types";

/**
 * PrefetchProvider - Prefetches critical data on app load
 *
 * This provider prefetches:
 * 1. Store settings (for invoice templates and business info)
 * 2. User preferences (for template selection and export settings)
 * 3. Default store (for store ID and full store data)
 *
 * Benefits:
 * - Faster initial page loads (data already in cache)
 * - Eliminates loading states on first render
 * - Reduces perceived latency
 * - Better UX with instant data availability
 */
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Prefetch all critical data in parallel
    const prefetchData = async () => {
      try {
        await Promise.all([
          // Prefetch store settings
          queryClient.prefetchQuery({
            queryKey: storeSettingsQueryKey,
            queryFn: async (): Promise<StoreSettings | null> => {
              const { data, error } = await storesService.getDefaultStore();

              if (error || !data) {
                return null;
              }

              const primaryContact =
                data.store_contacts?.find((c) => c.is_primary) ||
                data.store_contacts?.[0];

              const storeSettings: StoreSettings = {
                name: data.name,
                logo: data.logo || "",
                address: data.address,
                whatsapp: data.whatsapp,
                adminName: primaryContact?.name || data.name.split(" ")[0],
                adminTitle: primaryContact?.title ?? undefined,
                signature: primaryContact?.signature ?? undefined,
                email: data.email ?? undefined,
                phone: data.phone ?? undefined,
                website: data.website ?? undefined,
                brandColor: data.brand_color || "#000000",
                storeDescription: data.store_description ?? undefined,
                tagline: data.tagline ?? undefined,
                storeNumber: data.store_number ?? undefined,
                paymentMethod: data.payment_method ?? undefined,
                lastUpdated: new Date(),
              };

              return storeSettings;
            },
            staleTime: 5 * 60 * 1000,
          }),

          // Prefetch user preferences
          queryClient.prefetchQuery({
            queryKey: userPreferencesQueryKey,
            queryFn: async () => {
              const { data, error } =
                await userPreferencesService.getUserPreferences();

              if (error) {
                throw error;
              }

              return data;
            },
            staleTime: 30 * 60 * 1000,
          }),

          // Prefetch default store
          queryClient.prefetchQuery({
            queryKey: defaultStoreQueryKey,
            queryFn: async () => {
              const { data, error } = await storesService.getDefaultStore();

              if (error) {
                throw error;
              }

              return data;
            },
            staleTime: 30 * 60 * 1000,
          }),
        ]);
      } catch (error) {
        // Silently fail - queries will retry when components mount
        console.error("Prefetch error:", error);
      }
    };

    prefetchData();
  }, [user?.id, queryClient]);

  return <>{children}</>;
}
