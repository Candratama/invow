/**
 * Property-Based Test for Settings Cache Revalidation
 * 
 * **Feature: refactor-account-to-settings, Property 2: Mutations invalidate cache with revalidateTag**
 * **Validates: Requirements 2.2**
 * 
 * Property: For any mutation action (store update, preferences update, contact update),
 * the action SHALL call revalidateTag with the appropriate settings cache tag.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Expected cache tags (must match SETTINGS_CACHE_TAGS in settings.ts)
// Used for reference in test assertions
/* eslint-disable @typescript-eslint/no-unused-vars */
const EXPECTED_CACHE_TAGS = {
  store: 'settings-store',
  contacts: 'settings-contacts',
  subscription: 'settings-subscription',
  preferences: 'settings-preferences',
}
/* eslint-enable @typescript-eslint/no-unused-vars */

describe('Property 2: Mutations invalidate cache with revalidateTag', () => {
  const actionsDir = path.join(process.cwd(), 'app/actions')
  
  const storeFilePath = path.join(actionsDir, 'store.ts')
  const preferencesFilePath = path.join(actionsDir, 'preferences.ts')
  const paymentsFilePath = path.join(actionsDir, 'payments.ts')

  it('should verify store.ts imports revalidateTag from next/cache', () => {
    fc.assert(
      fc.property(
        fc.constant(storeFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import revalidateTag from next/cache
          const hasRevalidateTagImport = 
            fileContent.includes('revalidateTag') &&
            fileContent.includes("from 'next/cache'")

          expect(hasRevalidateTagImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify store.ts imports SETTINGS_CACHE_TAGS', () => {
    fc.assert(
      fc.property(
        fc.constant(storeFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import SETTINGS_CACHE_TAGS
          const hasSettingsCacheTagsImport = 
            fileContent.includes('SETTINGS_CACHE_TAGS') &&
            fileContent.includes('@/lib/db/data-access/settings')

          expect(hasSettingsCacheTagsImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify store.ts calls revalidateTag with store tag for store mutations', () => {
    fc.assert(
      fc.property(
        fc.constant(storeFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must call revalidateTag with SETTINGS_CACHE_TAGS.store
          const hasStoreTagRevalidation = 
            fileContent.includes('revalidateTag(SETTINGS_CACHE_TAGS.store)')

          expect(hasStoreTagRevalidation).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify store.ts calls revalidateTag with contacts tag for contact mutations', () => {
    fc.assert(
      fc.property(
        fc.constant(storeFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must call revalidateTag with SETTINGS_CACHE_TAGS.contacts
          const hasContactsTagRevalidation = 
            fileContent.includes('revalidateTag(SETTINGS_CACHE_TAGS.contacts)')

          expect(hasContactsTagRevalidation).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify preferences.ts imports revalidateTag from next/cache', () => {
    fc.assert(
      fc.property(
        fc.constant(preferencesFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import revalidateTag from next/cache
          const hasRevalidateTagImport = 
            fileContent.includes('revalidateTag') &&
            fileContent.includes("from 'next/cache'")

          expect(hasRevalidateTagImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify preferences.ts imports SETTINGS_CACHE_TAGS', () => {
    fc.assert(
      fc.property(
        fc.constant(preferencesFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import SETTINGS_CACHE_TAGS
          const hasSettingsCacheTagsImport = 
            fileContent.includes('SETTINGS_CACHE_TAGS') &&
            fileContent.includes('@/lib/db/data-access/settings')

          expect(hasSettingsCacheTagsImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify preferences.ts calls revalidateTag with preferences tag', () => {
    fc.assert(
      fc.property(
        fc.constant(preferencesFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must call revalidateTag with SETTINGS_CACHE_TAGS.preferences
          const hasPreferencesTagRevalidation = 
            fileContent.includes('revalidateTag(SETTINGS_CACHE_TAGS.preferences)')

          expect(hasPreferencesTagRevalidation).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify payments.ts imports revalidateTag from next/cache', () => {
    fc.assert(
      fc.property(
        fc.constant(paymentsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import revalidateTag from next/cache
          const hasRevalidateTagImport = 
            fileContent.includes('revalidateTag') &&
            fileContent.includes("from 'next/cache'")

          expect(hasRevalidateTagImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify payments.ts imports SETTINGS_CACHE_TAGS', () => {
    fc.assert(
      fc.property(
        fc.constant(paymentsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import SETTINGS_CACHE_TAGS
          const hasSettingsCacheTagsImport = 
            fileContent.includes('SETTINGS_CACHE_TAGS') &&
            fileContent.includes('@/lib/db/data-access/settings')

          expect(hasSettingsCacheTagsImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify payments.ts calls revalidateTag with subscription tag', () => {
    fc.assert(
      fc.property(
        fc.constant(paymentsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must call revalidateTag with SETTINGS_CACHE_TAGS.subscription
          const hasSubscriptionTagRevalidation = 
            fileContent.includes('revalidateTag(SETTINGS_CACHE_TAGS.subscription)')

          expect(hasSubscriptionTagRevalidation).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify all mutation files use /dashboard/settings path instead of /dashboard/account', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(storeFilePath, preferencesFilePath, paymentsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Should use /dashboard/settings, not /dashboard/account
          const usesSettingsPath = fileContent.includes('/dashboard/settings')
          const usesOldAccountPath = fileContent.includes('/dashboard/account')

          expect(usesSettingsPath).toBe(true)
          expect(usesOldAccountPath).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
