/**
 * Migration Service
 * Handles migration of local data to Supabase
 */

import { SyncService } from './sync'
import { getLocalDataForMigration, markMigrationComplete } from './migration-utils'
import type { StoreSettings, Invoice } from '@/lib/types'

export interface MigrationProgress {
  step: 'settings' | 'drafts' | 'completed' | 'done'
  current: number
  total: number
  message: string
}

export type ProgressCallback = (progress: MigrationProgress) => void

export class MigrationService {
  /**
   * Migrate user settings to Supabase
   * @param settings - Settings to migrate
   * @param onProgress - Progress callback
   * @returns Success status
   */
  async migrateSettings(
    settings: StoreSettings | null,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; error: Error | null }> {
    if (!settings || !settings.name) {
      onProgress?.({
        step: 'settings',
        current: 1,
        total: 1,
        message: 'No settings to migrate',
      })
      return { success: true, error: null }
    }

    try {
      onProgress?.({
        step: 'settings',
        current: 0,
        total: 1,
        message: 'Migrating store settings...',
      })

      const result = await SyncService.syncSettingsToDb(settings)

      if (result.error) {
        return { success: false, error: result.error }
      }

      onProgress?.({
        step: 'settings',
        current: 1,
        total: 1,
        message: 'Store settings migrated successfully',
      })

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to migrate settings'),
      }
    }
  }

  /**
   * Migrate invoices to Supabase
   * @param invoices - Invoices to migrate
   * @param step - Migration step name
   * @param onProgress - Progress callback
   * @returns Success status
   */
  async migrateInvoices(
    invoices: Invoice[],
    step: 'drafts' | 'completed',
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; error: Error | null; migrated: number }> {
    if (invoices.length === 0) {
      onProgress?.({
        step,
        current: 0,
        total: 0,
        message: `No ${step} to migrate`,
      })
      return { success: true, error: null, migrated: 0 }
    }

    let migrated = 0
    const errors: Error[] = []

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i]

      try {
        onProgress?.({
          step,
          current: i,
          total: invoices.length,
          message: `Migrating invoice ${invoice.invoiceNumber}...`,
        })

        const result = await SyncService.syncInvoiceToDb(invoice)

        if (result.error) {
          console.error(`Failed to migrate invoice ${invoice.id}:`, result.error)
          errors.push(result.error)
        } else {
          migrated++
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to migrate invoice ${invoice.id}:`, error)
        errors.push(
          error instanceof Error ? error : new Error('Unknown migration error')
        )
      }
    }

    onProgress?.({
      step,
      current: invoices.length,
      total: invoices.length,
      message: `Migrated ${migrated} of ${invoices.length} ${step}`,
    })

    if (errors.length > 0) {
      return {
        success: migrated > 0,
        error: new Error(
          `${errors.length} invoice(s) failed to migrate. ${migrated} succeeded.`
        ),
        migrated,
      }
    }

    return { success: true, error: null, migrated }
  }

  /**
   * Migrate all local data to Supabase
   * @param onProgress - Progress callback
   * @returns Migration summary
   */
  async migrateAllData(
    onProgress?: ProgressCallback
  ): Promise<{
    success: boolean
    error: Error | null
    summary: {
      settingsMigrated: boolean
      draftsMigrated: number
      completedMigrated: number
      totalMigrated: number
    }
  }> {
    const summary = {
      settingsMigrated: false,
      draftsMigrated: 0,
      completedMigrated: 0,
      totalMigrated: 0,
    }

    try {
      // Get local data
      const { settings, completedInvoices } =
        getLocalDataForMigration()

      // Step 1: Migrate settings
      const settingsResult = await this.migrateSettings(settings, onProgress)
      if (settingsResult.success) {
        summary.settingsMigrated = true
      }

      // Step 2: Skip draft migration (no more drafts)
      summary.draftsMigrated = 0

      // Step 3: Migrate completed invoices
      const completedResult = await this.migrateInvoices(
        completedInvoices,
        'completed',
        onProgress
      )
      summary.completedMigrated = completedResult.migrated

      summary.totalMigrated = summary.draftsMigrated + summary.completedMigrated

      // Mark migration as complete
      markMigrationComplete()

      onProgress?.({
        step: 'done',
        current: 1,
        total: 1,
        message: 'Migration completed successfully!',
      })

      // Check if any errors occurred
      const hasErrors =
        !settingsResult.success ||
        completedResult.error !== null

      if (hasErrors) {
        const errorMessages = [
          !settingsResult.success ? 'Settings migration failed' : null,
          completedResult.error?.message,
        ]
          .filter(Boolean)
          .join('; ')

        return {
          success: summary.totalMigrated > 0,
          error: new Error(errorMessages),
          summary,
        }
      }

      return { success: true, error: null, summary }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Migration failed'),
        summary,
      }
    }
  }
}

// Export singleton instance
export const migrationService = new MigrationService()
