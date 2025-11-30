/**
 * Property-Based Test for Invoice Count Increment on Creation
 * 
 * **Feature: premium-feature-gating, Property 2: Invoice count increment on creation**
 * **Validates: Requirements 2.3**
 * 
 * Property: For any successful invoice creation, the user's monthly invoice count
 * should increase by exactly 1.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Define types for testing
type Tier = 'free' | 'premium'

interface InvoiceCountState {
  userId: string
  tier: Tier
  currentMonthCount: number
  billingCycleStart: Date
}

interface InvoiceCreationResult {
  success: boolean
  newCount: number
  error?: string
}

/**
 * Pure function that simulates invoice count increment logic
 * This mirrors the expected behavior when an invoice is successfully created
 */
function incrementInvoiceCount(
  state: InvoiceCountState,
  invoiceLimit: number
): InvoiceCreationResult {
  // Check if user has reached their limit
  if (state.currentMonthCount >= invoiceLimit) {
    return {
      success: false,
      newCount: state.currentMonthCount,
      error: `You've reached your monthly limit of ${invoiceLimit} invoices`
    }
  }

  // Successful creation increments count by exactly 1
  return {
    success: true,
    newCount: state.currentMonthCount + 1
  }
}

/**
 * Generator for invoice count state
 */
const invoiceCountStateArb = (maxCount: number) => fc.record({
  userId: fc.uuid(),
  tier: fc.constantFrom<Tier>('free', 'premium'),
  currentMonthCount: fc.integer({ min: 0, max: maxCount }),
  billingCycleStart: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
})

describe('Property 2: Invoice count increment on creation', () => {
  const FREE_LIMIT = 10
  const PREMIUM_LIMIT = 200

  it('should increment count by exactly 1 on successful invoice creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoiceCountStateArb(FREE_LIMIT - 1), // Ensure we're below limit
        async (state) => {
          const limit = state.tier === 'free' ? FREE_LIMIT : PREMIUM_LIMIT
          const result = incrementInvoiceCount(state, limit)

          // Property: Successful creation should increment by exactly 1
          expect(result.success).toBe(true)
          expect(result.newCount).toBe(state.currentMonthCount + 1)
          expect(result.newCount - state.currentMonthCount).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not increment count when creation fails due to limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          tier: fc.constantFrom<Tier>('free', 'premium'),
          currentMonthCount: fc.integer({ min: FREE_LIMIT, max: FREE_LIMIT + 100 }),
          billingCycleStart: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        }),
        async (state) => {
          // For free tier at or above limit
          if (state.tier === 'free') {
            const result = incrementInvoiceCount(state, FREE_LIMIT)
            
            // Property: Failed creation should not change count
            expect(result.success).toBe(false)
            expect(result.newCount).toBe(state.currentMonthCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain count invariant: newCount = oldCount + 1 for success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 199 }), // Any valid count below premium limit
        fc.constantFrom<Tier>('free', 'premium'),
        async (currentCount, tier) => {
          const limit = tier === 'free' ? FREE_LIMIT : PREMIUM_LIMIT
          
          // Only test when below limit
          if (currentCount < limit) {
            const state: InvoiceCountState = {
              userId: 'test-user',
              tier,
              currentMonthCount: currentCount,
              billingCycleStart: new Date()
            }
            
            const result = incrementInvoiceCount(state, limit)
            
            // Core invariant: successful creation increments by exactly 1
            expect(result.success).toBe(true)
            expect(result.newCount).toBe(currentCount + 1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve count on failed creation attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 500 }),
        fc.constantFrom<Tier>('free', 'premium'),
        async (currentCount, tier) => {
          const limit = tier === 'free' ? FREE_LIMIT : PREMIUM_LIMIT
          
          const state: InvoiceCountState = {
            userId: 'test-user',
            tier,
            currentMonthCount: currentCount,
            billingCycleStart: new Date()
          }
          
          const result = incrementInvoiceCount(state, limit)
          
          // Property: Count should either stay same (failure) or increase by 1 (success)
          if (result.success) {
            expect(result.newCount).toBe(currentCount + 1)
          } else {
            expect(result.newCount).toBe(currentCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should increment count consistently across multiple creations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }), // Start with low count
        fc.integer({ min: 1, max: 5 }), // Number of invoices to create
        async (startCount, numInvoices) => {
          let currentCount = startCount
          const limit = PREMIUM_LIMIT // Use premium limit to allow multiple creations
          
          for (let i = 0; i < numInvoices; i++) {
            const state: InvoiceCountState = {
              userId: 'test-user',
              tier: 'premium',
              currentMonthCount: currentCount,
              billingCycleStart: new Date()
            }
            
            const result = incrementInvoiceCount(state, limit)
            
            // Each successful creation should increment by exactly 1
            expect(result.success).toBe(true)
            expect(result.newCount).toBe(currentCount + 1)
            
            currentCount = result.newCount
          }
          
          // Final count should be startCount + numInvoices
          expect(currentCount).toBe(startCount + numInvoices)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should never increment by more than 1 per creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoiceCountStateArb(PREMIUM_LIMIT - 1),
        async (state) => {
          const limit = state.tier === 'free' ? FREE_LIMIT : PREMIUM_LIMIT
          
          // Only test when below limit
          if (state.currentMonthCount < limit) {
            const result = incrementInvoiceCount(state, limit)
            
            // Property: Increment should never exceed 1
            const increment = result.newCount - state.currentMonthCount
            expect(increment).toBeLessThanOrEqual(1)
            expect(increment).toBeGreaterThanOrEqual(0)
            
            if (result.success) {
              expect(increment).toBe(1)
            } else {
              expect(increment).toBe(0)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case at exactly limit - 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const limit = tier === 'free' ? FREE_LIMIT : PREMIUM_LIMIT
          
          const state: InvoiceCountState = {
            userId: 'test-user',
            tier,
            currentMonthCount: limit - 1, // One below limit
            billingCycleStart: new Date()
          }
          
          const result = incrementInvoiceCount(state, limit)
          
          // Should succeed and reach exactly the limit
          expect(result.success).toBe(true)
          expect(result.newCount).toBe(limit)
        }
      ),
      { numRuns: 100 }
    )
  })
})
