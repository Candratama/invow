'use server'

import { updateTag } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/db/services/admin.service'
import {
  getInvoices as getInvoicesService,
  getInvoiceDetail as getInvoiceDetailService,
  deleteInvoice as deleteInvoiceService,
  updateInvoiceStatus as updateInvoiceStatusService,
} from '@/lib/db/services/admin-invoices.service'
import type { InvoiceFilters, InvoiceListItem, InvoiceDetail } from '@/lib/db/services/admin-invoices.service'

/**
 * Cache tags for admin invoice data (internal use only)
 */
const ADMIN_INVOICE_CACHE_TAGS = {
  invoices: 'admin-invoices',
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

/**
 * Verify admin access for mutations only
 * Read operations rely on middleware auth check
 */
async function verifyAdminAccessForMutation(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const adminStatus = await isAdmin(user.id)
  if (!adminStatus) {
    return null
  }

  return user.id
}

// ============================================
// READ OPERATIONS (cached, rely on middleware)
// ============================================

/**
 * Get admin invoices list (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminInvoices(filters: InvoiceFilters = {}): Promise<{
  success: boolean
  data?: { invoices: InvoiceListItem[]; total: number }
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getInvoicesService(filters),
      generateCacheKey('admin-invoices-list', filters),
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_INVOICE_CACHE_TAGS.invoices],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch invoices' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin invoices error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// INVOICE DETAIL (cached, rely on middleware)
// ============================================

/**
 * Get admin invoice detail (cached)
 * Auth is handled by middleware for /admin routes
 */
export async function getAdminInvoiceDetail(invoiceId: string): Promise<{
  success: boolean
  data?: InvoiceDetail
  error?: string
}> {
  try {
    const cachedFn = unstable_cache(
      async () => getInvoiceDetailService(invoiceId),
      [`admin-invoice-detail-${invoiceId}`],
      {
        revalidate: CACHE_REVALIDATE,
        tags: [ADMIN_INVOICE_CACHE_TAGS.invoices, `invoice-${invoiceId}`],
      }
    )

    const result = await cachedFn()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Invoice not found' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin invoice detail error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// MUTATION OPERATIONS (require admin verification)
// ============================================

/**
 * Delete an invoice (admin only)
 */
export async function deleteAdminInvoice(invoiceId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccessForMutation()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await deleteInvoiceService(invoiceId)

    if (!result.success) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to delete invoice' 
      }
    }

    // Revalidate cache
    updateTag(ADMIN_INVOICE_CACHE_TAGS.invoices)
    updateTag(`invoice-${invoiceId}`)

    return { success: true }
  } catch (error) {
    console.error('Delete admin invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update invoice status (admin only)
 */
export async function updateAdminInvoiceStatus(
  invoiceId: string, 
  status: 'draft' | 'pending' | 'synced'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccessForMutation()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await updateInvoiceStatusService(invoiceId, status)

    if (!result.success) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to update invoice status' 
      }
    }

    // Revalidate cache
    updateTag(ADMIN_INVOICE_CACHE_TAGS.invoices)
    updateTag(`invoice-${invoiceId}`)

    return { success: true }
  } catch (error) {
    console.error('Update admin invoice status error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Types are re-exported from the service module directly
// Import from '@/lib/db/services/admin-invoices.service' for type usage
