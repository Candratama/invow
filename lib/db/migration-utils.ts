/**
 * Migration Detection Utilities
 * Detects and prepares local data for migration to Supabase
 */

import type { StoreSettings, Invoice } from '@/lib/types'

export interface LocalDataSummary {
  hasSettings: boolean
  hasDrafts: boolean
  hasCompleted: boolean
  draftCount: number
  completedCount: number
  totalInvoices: number
}

/**
 * Detect if user has local data that needs migration
 * @returns Summary of local data
 */
export function detectLocalData(): LocalDataSummary {
  try {
    // Try to read from localStorage
    const storage = localStorage.getItem('invoice-storage')

    if (!storage) {
      return {
        hasSettings: false,
        hasDrafts: false,
        hasCompleted: false,
        draftCount: 0,
        completedCount: 0,
        totalInvoices: 0,
      }
    }

    const parsed = JSON.parse(storage)
    const state = parsed.state || parsed

    const draftCount = 0 // No more drafts
    const completedCount = state.completedInvoices?.length || 0

    return {
      hasSettings: !!state.storeSettings?.name,
      hasDrafts: false, // No more drafts
      hasCompleted: completedCount > 0,
      draftCount,
      completedCount,
      totalInvoices: completedCount,
    }
  } catch (error) {
    console.error('Failed to detect local data:', error)
    return {
      hasSettings: false,
      hasDrafts: false,
      hasCompleted: false,
      draftCount: 0,
      completedCount: 0,
      totalInvoices: 0,
    }
  }
}

/**
 * Get local data for migration
 * @returns Settings and invoices from localStorage
 */
export function getLocalDataForMigration(): {
  settings: StoreSettings | null
  draftInvoices: Invoice[]
  completedInvoices: Invoice[]
} {
  try {
    const storage = localStorage.getItem('invoice-storage')

    if (!storage) {
      return {
        settings: null,
        draftInvoices: [], // No more drafts
        completedInvoices: [],
      }
    }

    const parsed = JSON.parse(storage)
    const state = parsed.state || parsed

    return {
      settings: state.storeSettings || null,
      draftInvoices: [], // No more drafts
      completedInvoices: state.completedInvoices || [],
    }
  } catch (error) {
    console.error('Failed to get local data:', error)
    return {
      settings: null,
      draftInvoices: [], // No more drafts
      completedInvoices: [],
    }
  }
}

/**
 * Check if user has already migrated data
 * @returns True if migration marker exists
 */
export function hasMigrated(): boolean {
  try {
    const migrated = localStorage.getItem('data-migrated')
    return migrated === 'true'
  } catch {
    return false
  }
}

/**
 * Mark migration as complete
 */
export function markMigrationComplete(): void {
  try {
    localStorage.setItem('data-migrated', 'true')
    localStorage.setItem('migration-date', new Date().toISOString())
  } catch (error) {
    console.error('Failed to mark migration complete:', error)
  }
}

/**
 * Check if migration should be offered
 * @param isAuthenticated - Whether user is authenticated
 * @returns True if migration should be offered
 */
export function shouldOfferMigration(isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false
  if (hasMigrated()) return false

  const summary = detectLocalData()
  return summary.hasSettings || summary.totalInvoices > 0
}

/**
 * Reset migration status (for testing)
 */
export function resetMigrationStatus(): void {
  try {
    localStorage.removeItem('data-migrated')
    localStorage.removeItem('migration-date')
  } catch (error) {
    console.error('Failed to reset migration status:', error)
  }
}
