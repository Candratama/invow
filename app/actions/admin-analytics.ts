'use server'

import { unstable_cache } from 'next/cache'
import {
  getRevenueAnalytics as getRevenueAnalyticsService,
  exportRevenueCSV as exportRevenueCSVService,
  getUserAnalytics as getUserAnalyticsService,
  exportUserGrowthCSV as exportUserGrowthCSVService,
  getInvoiceAnalytics as getInvoiceAnalyticsService,
  exportInvoiceCSV as exportInvoiceCSVService,
} from '@/lib/db/services/admin-analytics.service'
import type { 
  AnalyticsDateRange, 
  RevenueAnalytics,
  UserAnalytics,
  InvoiceAnalytics,
} from '@/lib/db/services/admin-analytics.service'

/**
 * Cache tags for admin analytics data (internal use only)
 */
const ADMIN_ANALYTICS_CACHE_TAGS = {
  revenue: 'admin-analytics-revenue',
  users: 'admin-analytics-users',
  invoices: 'admin-analytics-invoices',
} as const

/**
 * Cache revalidation time in seconds (5 minutes for analytics)
 */
const CACHE_REVALIDATE = 300

/**
 * Generate cache key from date range
 */
function generateCacheKey(prefix: string, dateRange: AnalyticsDateRange): string[] {
  return [prefix, `${dateRange.from}-${dateRange.to}`]
}

// ============================================
// REVENUE ANALYTICS (cached, rely on middleware)
// ============================================

/**
 * Get revenue analytics for a date range (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminRevenueAnalytics(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: RevenueAnalytics
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getRevenueAnalyticsService(dateRange),
      generateCacheKey('admin-revenue-analytics', dateRange),
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_ANALYTICS_CACHE_TAGS.revenue],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch revenue analytics' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin revenue analytics error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Export revenue data as CSV for a date range
 * Auth is handled by middleware for /admin routes
 */
export async function exportAdminRevenueCSV(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: string
  rowCount?: number
  error?: string
}> {
  try {
    const result = await exportRevenueCSVService(dateRange)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to export revenue CSV' 
      }
    }

    return { 
      success: true, 
      data: result.data,
      rowCount: result.rowCount,
    }
  } catch (error) {
    console.error('Export admin revenue CSV error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// USER ANALYTICS (cached, rely on middleware)
// ============================================

/**
 * Get user analytics for a date range (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminUserAnalytics(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: UserAnalytics
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getUserAnalyticsService(dateRange),
      generateCacheKey('admin-user-analytics', dateRange),
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_ANALYTICS_CACHE_TAGS.users],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch user analytics' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin user analytics error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Export user growth data as CSV for a date range
 * Auth is handled by middleware for /admin routes
 */
export async function exportAdminUserGrowthCSV(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: string
  rowCount?: number
  error?: string
}> {
  try {
    const result = await exportUserGrowthCSVService(dateRange)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to export user growth CSV' 
      }
    }

    return { 
      success: true, 
      data: result.data,
      rowCount: result.rowCount,
    }
  } catch (error) {
    console.error('Export admin user growth CSV error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// INVOICE ANALYTICS (cached, rely on middleware)
// ============================================

/**
 * Get invoice analytics for a date range (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminInvoiceAnalytics(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: InvoiceAnalytics
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getInvoiceAnalyticsService(dateRange),
      generateCacheKey('admin-invoice-analytics', dateRange),
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_ANALYTICS_CACHE_TAGS.invoices],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch invoice analytics' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin invoice analytics error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Export invoice data as CSV for a date range
 * Auth is handled by middleware for /admin routes
 */
export async function exportAdminInvoiceCSV(dateRange: AnalyticsDateRange): Promise<{
  success: boolean
  data?: string
  rowCount?: number
  error?: string
}> {
  try {
    const result = await exportInvoiceCSVService(dateRange)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to export invoice CSV' 
      }
    }

    return { 
      success: true, 
      data: result.data,
      rowCount: result.rowCount,
    }
  } catch (error) {
    console.error('Export admin invoice CSV error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Types are re-exported from the service module directly
// Import from '@/lib/db/services/admin-analytics.service' for type usage
