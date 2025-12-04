'use server'

import { unstable_cache, updateTag } from 'next/cache'
import {
  getStores as getStoresService,
  getStoreDetail as getStoreDetailService,
  toggleStoreActive as toggleStoreActiveService,
  resetStoreInvoiceCounter as resetStoreInvoiceCounterService,
} from '@/lib/db/services/admin-stores.service'
import type { 
  StoreFilters, 
  StoreListItem, 
  StoreDetail 
} from '@/lib/db/services/admin-stores.service'

/**
 * Cache tags for admin store data (internal use only)
 */
const ADMIN_STORE_CACHE_TAGS = {
  stores: 'admin-stores',
  storeDetail: (id: string) => `admin-store-${id}`,
} as const

/**
 * Cache revalidation time in seconds (60 seconds)
 */
const CACHE_REVALIDATE = 60

/**
 * Generate cache key from filters
 */
function generateCacheKey(prefix: string, filters: object): string[] {
  const filterStr = JSON.stringify(filters)
  return [prefix, filterStr]
}

// ============================================
// READ OPERATIONS (cached, rely on middleware)
// ============================================

/**
 * Get admin stores list (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminStores(filters: StoreFilters = {}): Promise<{
  success: boolean
  data?: { stores: StoreListItem[]; total: number }
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getStoresService(filters),
      generateCacheKey('admin-stores-list', filters),
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_STORE_CACHE_TAGS.stores],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch stores' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin stores error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get admin store detail (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminStoreDetail(storeId: string): Promise<{
  success: boolean
  data?: StoreDetail
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getStoreDetailService(storeId),
      [`admin-store-detail-${storeId}`],
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_STORE_CACHE_TAGS.stores, ADMIN_STORE_CACHE_TAGS.storeDetail(storeId)],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Store not found' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin store detail error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// WRITE OPERATIONS (not cached, require auth check)
// ============================================

/**
 * Toggle store active status
 */
export async function toggleStoreActive(
  storeId: string, 
  isActive: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const result = await toggleStoreActiveService(storeId, isActive)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to toggle store status' 
      }
    }

    // Revalidate cache
    updateTag(ADMIN_STORE_CACHE_TAGS.stores)
    updateTag(ADMIN_STORE_CACHE_TAGS.storeDetail(storeId))

    return { success: true }
  } catch (error) {
    console.error('Toggle store active error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Reset store invoice counter
 */
export async function resetStoreInvoiceCounter(storeId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const result = await resetStoreInvoiceCounterService(storeId)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to reset invoice counter' 
      }
    }

    // Revalidate cache
    updateTag(ADMIN_STORE_CACHE_TAGS.stores)
    updateTag(ADMIN_STORE_CACHE_TAGS.storeDetail(storeId))

    return { success: true }
  } catch (error) {
    console.error('Reset store invoice counter error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Types are re-exported from the service module directly
// Import from '@/lib/db/services/admin-stores.service' for type usage
