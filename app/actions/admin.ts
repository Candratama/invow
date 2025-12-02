'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/db/services/admin.service'
import { 
  getDashboardMetrics as getMetrics, 
  getRecentTransactions as getRecentTransactionsService,
  type DashboardMetrics,
  type TransactionListItem
} from '@/lib/db/services/admin-metrics.service'
import {
  getUsers as getUsersService,
  getUserDetail as getUserDetailService,
  upgradeUser as upgradeUserService,
  downgradeUser as downgradeUserService,
  extendSubscription as extendSubscriptionService,
  resetInvoiceCounter as resetInvoiceCounterService,
  type UserFilters,
  type UserListItem,
  type UserDetail
} from '@/lib/db/services/admin-users.service'
import {
  getSubscriptions as getSubscriptionsService,
  type SubscriptionFilters,
  type SubscriptionListItem
} from '@/lib/db/services/admin-subscriptions.service'
import {
  getTransactions as getTransactionsService,
  verifyTransaction as verifyTransactionService,
  type TransactionFilters,
  type TransactionListItem as TransactionItem
} from '@/lib/db/services/admin-transactions.service'

/**
 * Verify that the current user is an admin
 * @returns User ID if admin, null otherwise
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

/**
 * Get dashboard metrics for admin panel
 * Requires admin authentication
 * 
 * @returns Dashboard metrics or error
 */
export async function getAdminDashboardMetrics(): Promise<{
  success: boolean
  data?: DashboardMetrics
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getMetrics()

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


/**
 * Get recent payment transactions for admin dashboard
 * Requires admin authentication
 * 
 * @param limit - Maximum number of transactions to return (default: 10)
 * @returns List of recent transactions or error
 */
export async function getAdminRecentTransactions(limit: number = 10): Promise<{
  success: boolean
  data?: TransactionListItem[]
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getRecentTransactionsService(limit)

    if (result.error) {
      return { 
        success: false, 
        error: result.error.message 
      }
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

/**
 * Get paginated list of users with filters
 * Requires admin authentication
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of users with total count
 */
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

    const result = await getUsersService(filters)

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

/**
 * Get detailed information about a specific user
 * Requires admin authentication
 * 
 * @param userId - The user ID to get details for
 * @returns User detail or error
 */
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

    const result = await getUserDetailService(userId)

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

/**
 * Upgrade user to premium tier
 * Requires admin authentication
 * 
 * @param userId - The user ID to upgrade
 * @returns Success status or error
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
 * Downgrade user to free tier
 * Requires admin authentication
 * 
 * @param userId - The user ID to downgrade
 * @returns Success status or error
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
 * Extend user subscription by specified days
 * Requires admin authentication
 * 
 * @param userId - The user ID to extend
 * @param days - Number of days to add
 * @returns Success status or error
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
 * Reset user's invoice counter to zero
 * Requires admin authentication
 * 
 * @param userId - The user ID to reset counter for
 * @returns Success status or error
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
 * Get paginated list of subscriptions with filters
 * Requires admin authentication
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of subscriptions with total count
 */
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

    const result = await getSubscriptionsService(filters)

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

/**
 * Get paginated list of transactions with filters
 * Requires admin authentication
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of transactions with total count
 */
export async function getTransactions(filters: TransactionFilters = {}): Promise<{
  success: boolean
  data?: { transactions: TransactionItem[]; total: number }
  error?: string
}> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await getTransactionsService(filters)

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

/**
 * Verify a transaction by setting verified_at timestamp
 * Requires admin authentication
 * 
 * @param transactionId - The transaction ID to verify
 * @returns Success status or error
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

    return { success: true }
  } catch (error) {
    console.error('Verify transaction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Re-export types for convenience
export type { DashboardMetrics, TransactionListItem, UserFilters, UserListItem, UserDetail, SubscriptionFilters, SubscriptionListItem, TransactionFilters, TransactionItem }
