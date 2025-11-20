import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService, subscriptionService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';
import type { InvoiceWithItems } from '@/lib/db/services/invoices.service';
import type { InvoiceInsert, InvoiceItemInsert } from '@/lib/db/database.types';

/**
 * Query Keys for React Query cache management
 */
export const queryKeys = {
  invoices: (page: number) => ['invoices', page] as const,
  subscriptionStatus: () => ['subscription-status'] as const,
};

/**
 * Paginated invoices response type
 */
interface PaginatedInvoicesResponse {
  invoices: InvoiceWithItems[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Custom hook to fetch paginated invoices with React Query
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background refetching when data becomes stale
 * - Pagination support with separate cache per page
 * - Optimized database query with JOIN (no N+1 problem)
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of invoices per page (default: 10)
 * @returns React Query result with paginated invoices data
 */
export function useInvoices(page: number = 1, pageSize: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.invoices(page),
    queryFn: async (): Promise<PaginatedInvoicesResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await invoicesService.getInvoicesPaginated(
        page,
        pageSize,
        'synced'
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Failed to fetch invoices');
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Custom hook to fetch subscription status with React Query
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background refetching when data becomes stale
 * - Includes tier, limits, and remaining invoices
 * 
 * @returns React Query result with subscription status data
 */
export function useSubscriptionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.subscriptionStatus(),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await subscriptionService.getSubscriptionStatus(user.id);

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Invoice creation data type
 */
interface CreateInvoiceData {
  invoice: Omit<InvoiceInsert, 'user_id'>;
  items: Omit<InvoiceItemInsert, 'invoice_id'>[];
}

/**
 * Custom hook to create invoices with optimistic updates
 * 
 * Features:
 * - Optimistic UI updates (instant feedback)
 * - Automatic rollback on error
 * - Cache invalidation for affected queries
 * - Subscription limit checking
 * 
 * @returns React Query mutation for creating invoices
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check subscription limit before creating
      const { data: canGenerate, error: limitError } = 
        await subscriptionService.canGenerateInvoice(user.id);

      if (limitError) {
        throw limitError;
      }

      if (!canGenerate) {
        throw new Error('Invoice limit reached for your subscription tier');
      }

      // Save invoice with items
      const { data, error } = await invoicesService.upsertInvoiceWithItems(
        invoiceData.invoice,
        invoiceData.items
      );

      if (error) {
        throw error;
      }

      // Increment invoice count
      const { error: incrementError } = await subscriptionService.incrementInvoiceCount(user.id);
      
      if (incrementError) {
        // Log error but don't fail the mutation since invoice was created
        console.error('Failed to increment invoice count:', incrementError);
      }

      return data;
    },
    onMutate: async (newInvoiceData) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices(1) });

      // Snapshot previous value for rollback
      const previousInvoices = queryClient.getQueryData<PaginatedInvoicesResponse>(
        queryKeys.invoices(1)
      );

      // Optimistically update cache with new invoice
      queryClient.setQueryData<PaginatedInvoicesResponse>(
        queryKeys.invoices(1),
        (old) => {
          if (!old) return old;

          // Create optimistic invoice object
          const optimisticInvoice: InvoiceWithItems = {
            ...newInvoiceData.invoice,
            id: `temp-${Date.now()}`, // Temporary ID
            user_id: user?.id || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            invoice_items: newInvoiceData.items.map((item, index) => ({
              id: `temp-item-${index}`,
              invoice_id: `temp-${Date.now()}`,
              description: item.description || '',
              quantity: item.quantity || 0,
              price: item.price || 0,
              subtotal: item.subtotal || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              position: item.position ?? index,
            })),
          } as InvoiceWithItems;

          return {
            ...old,
            invoices: [optimisticInvoice, ...old.invoices].slice(0, old.pageSize),
            total: old.total + 1,
            totalPages: Math.ceil((old.total + 1) / old.pageSize),
          };
        }
      );

      return { previousInvoices };
    },
    onError: (err, newInvoiceData, context) => {
      // Rollback optimistic update on error
      if (context?.previousInvoices) {
        queryClient.setQueryData(
          queryKeys.invoices(1),
          context.previousInvoices
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus() });
    },
  });
}

/**
 * Custom hook to delete invoices with optimistic updates
 * 
 * Features:
 * - Optimistic UI updates (instant removal)
 * - Automatic rollback on error
 * - Cache invalidation for affected queries
 * 
 * @returns React Query mutation for deleting invoices
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await invoicesService.deleteInvoice(invoiceId);
      
      if (error) {
        throw error;
      }
    },
    onMutate: async (invoiceId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['invoices'] });

      // Snapshot previous values for all invoice pages
      const previousData = new Map<string, PaginatedInvoicesResponse>();
      
      // Get all invoice query keys from cache
      const queryCache = queryClient.getQueryCache();
      const invoiceQueries = queryCache.findAll({ queryKey: ['invoices'] });

      // Store snapshots and optimistically update all pages
      invoiceQueries.forEach((query) => {
        const queryKey = query.queryKey;
        const data = query.state.data as PaginatedInvoicesResponse | undefined;
        
        if (data) {
          previousData.set(JSON.stringify(queryKey), data);
          
          // Optimistically remove invoice from this page
          queryClient.setQueryData<PaginatedInvoicesResponse>(
            queryKey,
            (old) => {
              if (!old) return old;
              
              return {
                ...old,
                invoices: old.invoices.filter((inv) => inv.id !== invoiceId),
                total: old.total - 1,
                totalPages: Math.ceil((old.total - 1) / old.pageSize),
              };
            }
          );
        }
      });

      return { previousData };
    },
    onError: (err, invoiceId, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousData) {
        context.previousData.forEach((data, queryKeyStr) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
