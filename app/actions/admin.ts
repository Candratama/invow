'use server'

import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/db/services/admin.service'
import {
  getAdminUsers,
  getAdminUserDetail,
  getAdminSubscriptions,
  getAdminTransactions,
  getAdminDashboardMetrics,
  getAdminRecentTransactions,
  ADMIN_CACHE_TAGS,
  type UserFilters,
  type UserListItem,
  type UserDetail,
  type SubscriptionFilters,
  type SubscriptionListItem,
  type TransactionFilters,
  type TransactionListItem,
  type DashboardMetrics,
  type RecentTransactionItem,
} from '@/lib/db/data-access/admin'
import {
  upgradeUser as upgradeUserService,
  downgradeUser as downgradeUserService,
  extendSubscription as extendSubscriptionService,
  resetInvoiceCounter as resetInvoiceCounterService,
} from '@/lib/db/services/admin-users.service'
import {
  verifyTransaction as verifyTransactionService,
} from '@/lib/db/services/admin-transactions.service'

/**
 * Verify admin access for any admin operation
 * Defense in depth: validates auth even if middleware should have caught it
 */
async function verifyAdminAccess(): Promise<string | null> {
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
// READ OPERATIONS (cached, with defense-in-depth auth)
// ============================================

export async function getAdminDashboardMetricsAction(): Promise<{
  success: boolean
  data?: DashboardMetrics
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getAdminDashboardMetrics()

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch dashboard metrics' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get admin dashboard metrics error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getAdminRecentTransactionsAction(limit: number = 10): Promise<{
  success: boolean
  data?: RecentTransactionItem[]
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getAdminRecentTransactions(limit)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Get admin recent transactions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getUsers(filters: UserFilters = {}): Promise<{
  success: boolean
  data?: { users: UserListItem[]; total: number }
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getAdminUsers(filters)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch users' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get users error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getUserDetail(userId: string): Promise<{
  success: boolean
  data?: UserDetail
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const result = await getAdminUserDetail(userId)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'User not found' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get user detail error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getSubscriptions(filters: SubscriptionFilters = {}): Promise<{
  success: boolean
  data?: { subscriptions: SubscriptionListItem[]; total: number }
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getAdminSubscriptions(filters)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch subscriptions' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<{
  success: boolean
  data?: { transactions: TransactionListItem[]; total: number }
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getAdminTransactions(filters)

    if (result.error || !result.data) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to fetch transactions' 
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get transactions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================
// MUTATION OPERATIONS (require auth check)
// ============================================

/**
 * Upgrade user to premium - revalidates cache
 */
export async function upgradeUserToPremium(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const result = await upgradeUserService(userId)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to upgrade user' 
      }
    }

    // Revalidate caches
    updateTag(ADMIN_CACHE_TAGS.users)
    updateTag(ADMIN_CACHE_TAGS.subscriptions)
    updateTag(ADMIN_CACHE_TAGS.metrics)

    return { success: true }
  } catch (error) {
    console.error('Upgrade user error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Downgrade user to free - revalidates cache
 */
export async function downgradeUserToFree(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const result = await downgradeUserService(userId)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to downgrade user' 
      }
    }

    // Revalidate caches
    updateTag(ADMIN_CACHE_TAGS.users)
    updateTag(ADMIN_CACHE_TAGS.subscriptions)
    updateTag(ADMIN_CACHE_TAGS.metrics)

    return { success: true }
  } catch (error) {
    console.error('Downgrade user error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Extend subscription - revalidates cache
 */
export async function extendSubscription(userId: string, days: number): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    if (!days || days <= 0) {
      return { success: false, error: 'Days must be a positive number' }
    }

    const result = await extendSubscriptionService(userId, days)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to extend subscription' 
      }
    }

    // Revalidate caches
    updateTag(ADMIN_CACHE_TAGS.users)
    updateTag(ADMIN_CACHE_TAGS.subscriptions)

    return { success: true }
  } catch (error) {
    console.error('Extend subscription error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Reset invoice counter - revalidates cache
 */
export async function resetInvoiceCounter(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const result = await resetInvoiceCounterService(userId)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to reset invoice counter' 
      }
    }

    // Revalidate caches
    updateTag(ADMIN_CACHE_TAGS.users)
    updateTag(ADMIN_CACHE_TAGS.subscriptions)

    return { success: true }
  } catch (error) {
    console.error('Reset invoice counter error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Verify transaction - revalidates cache
 */
export async function verifyTransaction(transactionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    if (!transactionId) {
      return { success: false, error: 'Transaction ID is required' }
    }

    const result = await verifyTransactionService(transactionId)

    if (!result.success || result.error) {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to verify transaction' 
      }
    }

    // Revalidate caches
    updateTag(ADMIN_CACHE_TAGS.transactions)

    return { success: true }
  } catch (error) {
    console.error('Verify transaction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Types are re-exported from the data-access module directly
// Import from '@/lib/db/data-access/admin' for type usage
