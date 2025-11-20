import { useQuery } from '@tanstack/react-query';
import { storesService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Query key for default store
 */
export const defaultStoreQueryKey = ['default-store'] as const;

/**
 * Custom hook to fetch default store with React Query
 * Returns the full store object including ID
 * 
 * @returns React Query result with default store data
 */
export function useDefaultStore() {
  const { user } = useAuth();

  return useQuery({
    queryKey: defaultStoreQueryKey,
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await storesService.getDefaultStore();
      
      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes - store rarely changes
  });
}
