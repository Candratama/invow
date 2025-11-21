import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';
import { StoreSettings } from '@/lib/types';

/**
 * Query key for store settings
 */
export const storeSettingsQueryKey = ['store-settings'] as const;

/**
 * Custom hook to fetch store settings with React Query
 * 
 * Features:
 * - Automatic caching with 30-minute stale time (store settings rarely change)
 * - Background refetching when data becomes stale
 * - Transforms database Store format to StoreSettings format
 * - Includes primary contact information
 * 
 * @returns React Query result with store settings data
 */
export function useStoreSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: async (): Promise<StoreSettings | null> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await storesService.getDefaultStore();
      
      if (error) {
        throw error;
      }

      // Return null if no store found
      if (!data) {
        return null;
      }

      // Find primary contact or fallback to first contact
      const primaryContact = data.store_contacts?.find(c => c.is_primary) || 
                            data.store_contacts?.[0];

      // Transform database Store format to StoreSettings format
      const storeSettings: StoreSettings = {
        name: data.name,
        logo: data.logo || "",
        address: data.address,
        whatsapp: data.whatsapp,
        adminName: primaryContact?.name || data.name.split(' ')[0],
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
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduced from 30 for fresher data
    refetchOnWindowFocus: true, // Refetch when window regains focus for multi-tab consistency
  });
}
