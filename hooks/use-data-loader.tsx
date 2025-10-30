'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useInvoiceStore } from '@/lib/store'
import { SyncService } from '@/lib/db/sync'
import { hasMigrated } from '@/lib/db/migration-utils'

/**
 * Hook to load data from Supabase after login/migration
 * Automatically loads settings and invoices for authenticated users
 */
export function useDataLoader() {
  const { user, loading: authLoading } = useAuth()
  const { setStoreSettings } = useInvoiceStore()
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Only load if user is authenticated and we haven't loaded yet
    if (!user || authLoading || loaded) return

    // Only load if user has migrated (meaning they have cloud data)
    if (!hasMigrated()) return

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Load settings from Supabase
        const settings = await SyncService.syncSettingsFromDb()
        if (settings) {
          setStoreSettings(settings)
        }

        // Note: Invoices are loaded on-demand in the UI
        // We don't load all invoices on startup to improve performance

        setLoaded(true)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load data')
        setError(error)
        console.error('Failed to load data from Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, authLoading, loaded, setStoreSettings])

  return { loading, loaded, error }
}

/**
 * Hook to sync data periodically while online
 * Auto-syncs drafts and settings at regular intervals
 */
export function useAutoDataSync(intervalMinutes: number = 5) {
  const { user } = useAuth()
  const { isOffline, draftInvoices, storeSettings } = useInvoiceStore()
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Don't sync if offline or not authenticated
    if (!user || isOffline) return

    // Don't sync if no data to sync
    if (!storeSettings && draftInvoices.length === 0) return

    const syncData = async () => {
      try {
        // Sync settings if they exist
        if (storeSettings) {
          await SyncService.syncSettingsToDb(storeSettings)
        }

        // Sync drafts
        for (const draft of draftInvoices) {
          await SyncService.syncInvoiceToDb(draft)
        }

        setLastSync(new Date())
        console.log('✅ Auto-sync completed')
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }

    // Initial sync after 30 seconds
    const initialTimer = setTimeout(syncData, 30000)

    // Periodic sync
    const interval = setInterval(syncData, intervalMinutes * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [user, isOffline, draftInvoices, storeSettings, intervalMinutes])

  return { lastSync }
}
