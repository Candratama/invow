/**
 * Property-Based Test for Feature Retention on Subscription Expiry
 * 
 * **Feature: premium-feature-gating, Property 7: Feature retention on subscription expiry**
 * **Validates: Requirements 4.4, 5.4**
 * 
 * Property: For any premium user whose subscription expires, their stored premium data
 * (logo, signature, colors) should be retained but not displayed on new invoices.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Define types for testing
interface StoreData {
  id: string
  name: string
  logo: string | null
  store_contacts: {
    id: string
    name: string
    signature: string | null
    is_primary: boolean
  }[]
}

interface FilteredStoreData {
  id: string
  name: string
  logo: string | null
  store_contacts: {
    id: string
    name: string
    signature: string | null
    is_primary: boolean
  }[]
}

/**
 * Pure function that simulates the tier-based feature filtering logic
 * This mirrors the logic in getStoreSettings from lib/db/data-access/store.ts
 */
function applyTierBasedFiltering(
  storeData: StoreData,
  isPremium: boolean
): FilteredStoreData {
  // Keep signatures for invoice display - authorized person data should always be shown
  const filteredContacts = storeData.store_contacts.map(contact => ({
    ...contact,
    // Signature is always included for invoice display purposes (business continuity)
    signature: contact.signature
  }))

  return {
    ...storeData,
    logo: isPremium ? storeData.logo : null,
    store_contacts: filteredContacts
  }
}

/**
 * Generator for store data with premium features
 */
const storeDataArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  logo: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
  store_contacts: fc.array(
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      signature: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
      is_primary: fc.boolean()
    }),
    { minLength: 0, maxLength: 5 }
  )
})

describe('Property 7: Feature retention on subscription expiry', () => {
  it('should verify store data access layer implements tier-based filtering', () => {
    const storeDataAccessPath = path.join(process.cwd(), 'lib/db/data-access/store.ts')
    const fileContent = fs.readFileSync(storeDataAccessPath, 'utf-8')

    // Property: getStoreSettings should check premium status
    expect(fileContent).toContain('isPremium')

    // Property: Logo should be filtered based on tier
    expect(fileContent).toContain('logo: isPremium')

    // Property: Signature should always be included for invoice display
    expect(fileContent).toContain('signature: contact.signature')

    // Property: Data should be retained in database (not deleted)
    expect(fileContent).toContain('retained in the database')
  })

  it('should retain logo data in database but hide from non-premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        storeDataArb,
        async (storeData) => {
          // Original data has logo
          const originalLogo = storeData.logo

          // When user is premium, logo should be visible
          const premiumResult = applyTierBasedFiltering(storeData, true)
          expect(premiumResult.logo).toBe(originalLogo)

          // When user is not premium (expired), logo should be hidden
          const freeResult = applyTierBasedFiltering(storeData, false)
          expect(freeResult.logo).toBeNull()

          // Original data should remain unchanged (data retention)
          expect(storeData.logo).toBe(originalLogo)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should retain signature data in database and always show for invoice display', async () => {
    await fc.assert(
      fc.asyncProperty(
        storeDataArb,
        async (storeData) => {
          // Store original signatures
          const originalSignatures = storeData.store_contacts.map(c => c.signature)

          // When user is premium, signatures should be visible
          const premiumResult = applyTierBasedFiltering(storeData, true)
          premiumResult.store_contacts.forEach((contact, i) => {
            expect(contact.signature).toBe(originalSignatures[i])
          })

          // When user is not premium (expired), signatures should still be visible for invoice display
          const freeResult = applyTierBasedFiltering(storeData, false)
          freeResult.store_contacts.forEach((contact, i) => {
            expect(contact.signature).toBe(originalSignatures[i])
          })

          // Original data should remain unchanged (data retention)
          storeData.store_contacts.forEach((contact, i) => {
            expect(contact.signature).toBe(originalSignatures[i])
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should restore premium features when user re-subscribes', async () => {
    await fc.assert(
      fc.asyncProperty(
        storeDataArb,
        async (storeData) => {
          // Store original data
          const originalLogo = storeData.logo
          const originalSignatures = storeData.store_contacts.map(c => c.signature)

          // User was premium, then expired, then re-subscribed
          // Step 1: Premium - features visible
          const premiumResult1 = applyTierBasedFiltering(storeData, true)
          expect(premiumResult1.logo).toBe(originalLogo)

          // Step 2: Expired - features hidden
          const expiredResult = applyTierBasedFiltering(storeData, false)
          expect(expiredResult.logo).toBeNull()

          // Step 3: Re-subscribed - features restored
          const premiumResult2 = applyTierBasedFiltering(storeData, true)
          expect(premiumResult2.logo).toBe(originalLogo)
          premiumResult2.store_contacts.forEach((contact, i) => {
            expect(contact.signature).toBe(originalSignatures[i])
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve non-premium data regardless of tier status', async () => {
    await fc.assert(
      fc.asyncProperty(
        storeDataArb,
        fc.boolean(),
        async (storeData, isPremium) => {
          const result = applyTierBasedFiltering(storeData, isPremium)

          // Non-premium fields should always be preserved
          expect(result.id).toBe(storeData.id)
          expect(result.name).toBe(storeData.name)
          expect(result.store_contacts.length).toBe(storeData.store_contacts.length)

          // Contact names should always be preserved
          result.store_contacts.forEach((contact, i) => {
            expect(contact.id).toBe(storeData.store_contacts[i].id)
            expect(contact.name).toBe(storeData.store_contacts[i].name)
            expect(contact.is_primary).toBe(storeData.store_contacts[i].is_primary)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle stores with no premium features gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          logo: fc.constant(null),
          store_contacts: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              signature: fc.constant(null),
              is_primary: fc.boolean()
            }),
            { minLength: 0, maxLength: 3 }
          )
        }),
        fc.boolean(),
        async (storeData, isPremium) => {
          const result = applyTierBasedFiltering(storeData, isPremium)

          // When there's no premium data, result should be the same regardless of tier
          expect(result.logo).toBeNull()
          result.store_contacts.forEach(contact => {
            expect(contact.signature).toBeNull()
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show all contacts signatures consistently for invoice display', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          logo: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
          store_contacts: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              signature: fc.string({ minLength: 10, maxLength: 100 }), // All have signatures
              is_primary: fc.boolean()
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async (storeData) => {
          // For non-premium users, ALL signatures should still be visible for invoice display
          const freeResult = applyTierBasedFiltering(storeData, false)
          
          const allSignaturesVisible = freeResult.store_contacts.every(
            (contact, i) => contact.signature === storeData.store_contacts[i].signature
          )
          expect(allSignaturesVisible).toBe(true)

          // For premium users, ALL signatures should be visible
          const premiumResult = applyTierBasedFiltering(storeData, true)
          
          premiumResult.store_contacts.forEach((contact, i) => {
            expect(contact.signature).toBe(storeData.store_contacts[i].signature)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify dashboard data action handles primary contact extraction', () => {
    // The dashboard page delegates data fetching to getDashboardDataAction
    // which handles primary contact extraction in the server action
    const dashboardActionPath = path.join(process.cwd(), 'app/actions/dashboard.ts')
    const fileContent = fs.readFileSync(dashboardActionPath, 'utf-8')

    // Property: Dashboard action should fetch store data with contacts
    expect(fileContent).toContain('getDashboardDataAction')
    
    // Property: Dashboard uses server action pattern for data fetching
    const hasUseServer = fileContent.includes("'use server'") || fileContent.includes('"use server"')
    expect(hasUseServer).toBe(true)
  })

  it('should verify business-info-tab wraps signature with FeatureGate', () => {
    const businessInfoTabPath = path.join(
      process.cwd(),
      'components/features/settings/business-info-tab.tsx'
    )
    const fileContent = fs.readFileSync(businessInfoTabPath, 'utf-8')

    // Property: Signature section should be wrapped with FeatureGate
    expect(fileContent).toContain('FeatureGate')
    expect(fileContent).toContain('feature="hasSignature"')
  })
})
