import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStoreSettings, storeSettingsQueryKey } from '../use-store-settings';
import { storesService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';
import React from 'react';
import fc from 'fast-check';

/**
 * Feature: store-brand-color-application, Property 7: Navigation maintains consistency
 * Validates: Requirements 2.5
 * 
 * Property: For any navigation from settings to invoice preview, 
 * the preview should display the updated brand color without requiring a page refresh
 */

// Mock dependencies
vi.mock('@/lib/db/services', () => ({
  storesService: {
    getDefaultStore: vi.fn(),
    updateStore: vi.fn(),
  },
}));

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return { Wrapper, queryClient };
};

// Hex color generator for property-based testing
// Generate valid hex colors in format #RRGGBB
const hexColorArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
});

describe('Property-Based Test: Navigation Consistency', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
      session: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it('should maintain brand color consistency when navigating from settings to preview', async () => {
    await fc.assert(
      fc.asyncProperty(hexColorArbitrary, async (brandColor) => {
        // Create a fresh QueryClient for each test iteration
        const { Wrapper, queryClient } = createWrapper();

        const mockStoreData = {
          id: 'store-1',
          user_id: mockUser.id,
          name: 'Test Store',
          address: '123 Test St',
          whatsapp: '+62812345678',
          brand_color: brandColor,
          store_code: 'TST',
          invoice_prefix: 'INV',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          store_contacts: [],
        };

        // Mock the initial fetch
        vi.mocked(storesService.getDefaultStore).mockResolvedValue({
          data: mockStoreData,
          error: null,
        });

        // Simulate settings component: fetch store settings
        const { result: settingsResult } = renderHook(() => useStoreSettings(), {
          wrapper: Wrapper,
        });

        // Wait for settings to load
        await waitFor(() => {
          expect(settingsResult.current.isSuccess).toBe(true);
        }, { timeout: 3000 });

        // Verify settings received the brand color
        expect(settingsResult.current.data?.brandColor).toBe(brandColor);

        // Simulate user updating the brand color (cache invalidation happens in the component)
        await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });

        // Wait for refetch to complete
        await waitFor(() => {
          expect(settingsResult.current.isFetching).toBe(false);
        }, { timeout: 3000 });

        // Simulate navigation to preview: render a new hook instance (simulating preview component mount)
        const { result: previewResult } = renderHook(() => useStoreSettings(), {
          wrapper: Wrapper,
        });

        // Wait for preview to load
        await waitFor(() => {
          expect(previewResult.current.isSuccess).toBe(true);
        }, { timeout: 3000 });

        // Property: Preview should display the same brand color without page refresh
        expect(previewResult.current.data?.brandColor).toBe(brandColor);
        
        // Verify the brand color is consistent between settings and preview
        expect(previewResult.current.data?.brandColor).toBe(settingsResult.current.data?.brandColor);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  }, 30000); // 30 second timeout for property-based test

  it('should refetch brand color when window regains focus', async () => {
    await fc.assert(
      fc.asyncProperty(
        hexColorArbitrary,
        hexColorArbitrary,
        async (initialColor, updatedColor) => {
          // Ensure colors are different for meaningful test
          fc.pre(initialColor !== updatedColor);

          const { Wrapper, queryClient } = createWrapper();

          const mockStoreData = {
            id: 'store-1',
            user_id: mockUser.id,
            name: 'Test Store',
            address: '123 Test St',
            whatsapp: '+62812345678',
            brand_color: initialColor,
            store_code: 'TST',
            invoice_prefix: 'INV',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            store_contacts: [],
          };

          // Mock initial fetch with first color
          vi.mocked(storesService.getDefaultStore).mockResolvedValueOnce({
            data: mockStoreData,
            error: null,
          });

          const { result } = renderHook(() => useStoreSettings(), {
            wrapper: Wrapper,
          });

          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          }, { timeout: 3000 });

          expect(result.current.data?.brandColor).toBe(initialColor);

          // Simulate color update in another tab/window
          const updatedStoreData = {
            ...mockStoreData,
            brand_color: updatedColor,
          };

          vi.mocked(storesService.getDefaultStore).mockResolvedValueOnce({
            data: updatedStoreData,
            error: null,
          });

          // Invalidate cache (simulating window focus refetch)
          await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });

          await waitFor(() => {
            expect(result.current.isFetching).toBe(false);
          }, { timeout: 3000 });

          // Property: After refetch, should have the updated color
          expect(result.current.data?.brandColor).toBe(updatedColor);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30 second timeout for property-based test

  it('should handle cache invalidation correctly across multiple navigation cycles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(hexColorArbitrary, { minLength: 2, maxLength: 5 }),
        async (brandColors) => {
          // Create a fresh QueryClient for each property test iteration
          const { Wrapper, queryClient } = createWrapper();

          // Test multiple update-navigate cycles
          for (let i = 0; i < brandColors.length; i++) {
            const currentColor = brandColors[i];

            const mockStoreData = {
              id: 'store-1',
              user_id: mockUser.id,
              name: 'Test Store',
              address: '123 Test St',
              whatsapp: '+62812345678',
              brand_color: currentColor,
              store_code: 'TST',
              invoice_prefix: 'INV',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              store_contacts: [],
            };

            // Clear previous mocks and set up new one
            vi.mocked(storesService.getDefaultStore).mockResolvedValueOnce({
              data: mockStoreData,
              error: null,
            });

            // Invalidate cache before each fetch to ensure fresh data
            if (i > 0) {
              await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
            }

            // Simulate navigation to preview
            const { result } = renderHook(() => useStoreSettings(), {
              wrapper: Wrapper,
            });

            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            }, { timeout: 3000 });

            // Property: Each navigation should show the current brand color
            expect(result.current.data?.brandColor).toBe(currentColor);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30 second timeout for property-based test
});
