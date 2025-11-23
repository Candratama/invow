import { useQuery } from '@tanstack/react-query';
import { userPreferencesService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';
import type { UserPreferences } from '@/lib/db/database.types';

/**
 * Query key for user preferences
 */
export const userPreferencesQueryKey = ['user-preferences'] as const;

/**
 * Custom hook to fetch user preferences with React Query
 * 
 * Features:
 * - Automatic caching with 30-minute stale time (preferences rarely change)
 * - Background refetching when data becomes stale
 * - Returns default values if no preferences found
 * - Includes export quality, tax settings, and selected template
 * 
 * @returns React Query result with user preferences data
 */
export function useUserPreferences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: userPreferencesQueryKey,
    queryFn: async (): Promise<UserPreferences> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await userPreferencesService.getUserPreferences();
      
      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes - preferences rarely change
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}
