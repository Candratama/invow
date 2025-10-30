'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import {
  detectLocalData,
  shouldOfferMigration,
  type LocalDataSummary,
} from '@/lib/db/migration-utils'

/**
 * Hook to manage data migration from local storage to Supabase
 */
export function useMigration() {
  const { user, loading: authLoading } = useAuth()
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [dataSummary, setDataSummary] = useState<LocalDataSummary | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Don't check until auth is loaded
    if (authLoading) return
    if (checked) return

    // Check if migration should be offered
    const shouldMigrate = shouldOfferMigration(!!user)

    if (shouldMigrate) {
      const summary = detectLocalData()
      setDataSummary(summary)

      // Small delay to let the app load first
      setTimeout(() => {
        setShowMigrationModal(true)
      }, 1000)
    }

    setChecked(true)
  }, [user, authLoading, checked])

  const closeMigrationModal = () => {
    setShowMigrationModal(false)
  }

  const handleMigrationComplete = () => {
    setShowMigrationModal(false)
    // Optionally reload the page or refresh data
    window.location.reload()
  }

  return {
    showMigrationModal,
    dataSummary,
    closeMigrationModal,
    handleMigrationComplete,
  }
}
