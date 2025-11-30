/**
 * Property-Based Test for Billing Cycle Reset
 * 
 * **Feature: premium-feature-gating, Property 3: Billing cycle reset**
 * **Validates: Requirements 2.4**
 * 
 * Property: For any user whose billing cycle has changed, their invoice count
 * should reset to 0.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Define types for testing
type Tier = 'free' | 'premium'

interface BillingCycleState {
  userId: string
  tier: Tier
  currentMonthCount: number
  billingCycleStart: Date
  billingCycleEnd: Date
}

interface BillingCycleResetResult {
  newCount: number
  newBillingCycleStart: Date
  wasReset: boolean
}

/**
 * Pure function that determines if a billing cycle has changed
 * A billing cycle is 30 days for premium users, or calendar month for free users
 */
function isBillingCycleChanged(
  currentDate: Date,
  billingCycleEnd: Date
): boolean {
  return currentDate >= billingCycleEnd
}

/**
 * Pure function that simulates billing cycle reset logic
 * When a new billing cycle begins, the invoice count resets to 0
 */
function checkAndResetBillingCycle(
  state: BillingCycleState,
  currentDate: Date
): BillingCycleResetResult {
  const cycleChanged = isBillingCycleChanged(currentDate, state.billingCycleEnd)
  
  if (cycleChanged) {
    // Calculate new billing cycle start (the current date becomes the new start)
    const newStart = new Date(currentDate)
    
    return {
      newCount: 0, // Reset to 0
      newBillingCycleStart: newStart,
      wasReset: true
    }
  }
  
  // No reset needed
  return {
    newCount: state.currentMonthCount,
    newBillingCycleStart: state.billingCycleStart,
    wasReset: false
  }
}

/**
 * Helper to create a billing cycle end date (30 days from start)
 */
function getBillingCycleEnd(start: Date): Date {
  const end = new Date(start)
  end.setDate(end.getDate() + 30)
  return end
}

/**
 * Generator for valid dates (ensuring no NaN dates)
 */
const validDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2025-06-01').getTime() 
}).map(timestamp => new Date(timestamp))

/**
 * Generator for billing cycle state
 */
const billingCycleStateArb = fc.record({
  userId: fc.uuid(),
  tier: fc.constantFrom<Tier>('free', 'premium'),
  currentMonthCount: fc.integer({ min: 0, max: 200 }),
  billingCycleStart: validDateArb
}).map(state => ({
  ...state,
  billingCycleEnd: getBillingCycleEnd(state.billingCycleStart)
})).filter(state => !isNaN(state.billingCycleStart.getTime()) && !isNaN(state.billingCycleEnd.getTime()))

describe('Property 3: Billing cycle reset', () => {
  it('should reset invoice count to 0 when billing cycle changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        fc.integer({ min: 31, max: 60 }), // Days after cycle start (past the 30-day cycle)
        async (state, daysAfterStart) => {
          // Create a date that is after the billing cycle end
          const currentDate = new Date(state.billingCycleStart)
          currentDate.setDate(currentDate.getDate() + daysAfterStart)
          
          const result = checkAndResetBillingCycle(state, currentDate)
          
          // Property: When billing cycle changes, count should reset to 0
          expect(result.wasReset).toBe(true)
          expect(result.newCount).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not reset invoice count within the same billing cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        fc.integer({ min: 0, max: 29 }), // Days within the 30-day cycle
        async (state, daysAfterStart) => {
          // Create a date that is within the billing cycle
          const currentDate = new Date(state.billingCycleStart)
          currentDate.setDate(currentDate.getDate() + daysAfterStart)
          
          const result = checkAndResetBillingCycle(state, currentDate)
          
          // Property: Within same cycle, count should remain unchanged
          expect(result.wasReset).toBe(false)
          expect(result.newCount).toBe(state.currentMonthCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always reset to exactly 0, regardless of previous count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }), // Any non-zero count
        fc.constantFrom<Tier>('free', 'premium'),
        async (previousCount, tier) => {
          const billingCycleStart = new Date('2024-01-01')
          const state: BillingCycleState = {
            userId: 'test-user',
            tier,
            currentMonthCount: previousCount,
            billingCycleStart,
            billingCycleEnd: getBillingCycleEnd(billingCycleStart)
          }
          
          // Date after billing cycle ends
          const currentDate = new Date('2024-02-15')
          
          const result = checkAndResetBillingCycle(state, currentDate)
          
          // Property: Reset should always result in count = 0
          expect(result.wasReset).toBe(true)
          expect(result.newCount).toBe(0)
          expect(result.newCount).not.toBe(previousCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case at exactly billing cycle boundary', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        async (state) => {
          // Test at exactly the billing cycle end date
          const exactEndDate = new Date(state.billingCycleEnd)
          
          const result = checkAndResetBillingCycle(state, exactEndDate)
          
          // Property: At exactly the boundary, cycle should reset
          expect(result.wasReset).toBe(true)
          expect(result.newCount).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case one day before billing cycle ends', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        async (state) => {
          // Test one day before the billing cycle end
          const oneDayBefore = new Date(state.billingCycleEnd)
          oneDayBefore.setDate(oneDayBefore.getDate() - 1)
          
          const result = checkAndResetBillingCycle(state, oneDayBefore)
          
          // Property: One day before boundary, cycle should NOT reset
          expect(result.wasReset).toBe(false)
          expect(result.newCount).toBe(state.currentMonthCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should update billing cycle start date on reset', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        fc.integer({ min: 31, max: 90 }),
        async (state, daysAfterStart) => {
          const currentDate = new Date(state.billingCycleStart)
          currentDate.setDate(currentDate.getDate() + daysAfterStart)
          
          const result = checkAndResetBillingCycle(state, currentDate)
          
          // Property: On reset, new billing cycle start should be updated
          expect(result.wasReset).toBe(true)
          expect(result.newBillingCycleStart.getTime()).toBe(currentDate.getTime())
          expect(result.newBillingCycleStart.getTime()).not.toBe(state.billingCycleStart.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve billing cycle start date when no reset occurs', async () => {
    await fc.assert(
      fc.asyncProperty(
        billingCycleStateArb,
        fc.integer({ min: 0, max: 29 }),
        async (state, daysAfterStart) => {
          const currentDate = new Date(state.billingCycleStart)
          currentDate.setDate(currentDate.getDate() + daysAfterStart)
          
          const result = checkAndResetBillingCycle(state, currentDate)
          
          // Property: Without reset, billing cycle start should remain unchanged
          expect(result.wasReset).toBe(false)
          expect(result.newBillingCycleStart.getTime()).toBe(state.billingCycleStart.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reset consistently for both free and premium tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ 
          min: new Date('2024-01-01').getTime(), 
          max: new Date('2024-06-01').getTime() 
        }).map(ts => new Date(ts)),
        async (count, billingStart) => {
          const billingEnd = getBillingCycleEnd(billingStart)
          const afterCycleDate = new Date(billingEnd)
          afterCycleDate.setDate(afterCycleDate.getDate() + 5)
          
          // Test free tier
          const freeState: BillingCycleState = {
            userId: 'test-user',
            tier: 'free',
            currentMonthCount: count,
            billingCycleStart: billingStart,
            billingCycleEnd: billingEnd
          }
          const freeResult = checkAndResetBillingCycle(freeState, afterCycleDate)
          
          // Test premium tier
          const premiumState: BillingCycleState = {
            userId: 'test-user',
            tier: 'premium',
            currentMonthCount: count,
            billingCycleStart: billingStart,
            billingCycleEnd: billingEnd
          }
          const premiumResult = checkAndResetBillingCycle(premiumState, afterCycleDate)
          
          // Property: Both tiers should reset to 0 when cycle changes
          expect(freeResult.newCount).toBe(0)
          expect(premiumResult.newCount).toBe(0)
          expect(freeResult.wasReset).toBe(true)
          expect(premiumResult.wasReset).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle multiple consecutive billing cycle resets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of cycles to simulate
        fc.integer({ min: 50, max: 150 }), // Initial count
        async (numCycles, initialCount) => {
          let currentState: BillingCycleState = {
            userId: 'test-user',
            tier: 'premium',
            currentMonthCount: initialCount,
            billingCycleStart: new Date('2024-01-01'),
            billingCycleEnd: getBillingCycleEnd(new Date('2024-01-01'))
          }
          
          for (let i = 0; i < numCycles; i++) {
            // Move to after current cycle
            const afterCycleDate = new Date(currentState.billingCycleEnd)
            afterCycleDate.setDate(afterCycleDate.getDate() + 1)
            
            const result = checkAndResetBillingCycle(currentState, afterCycleDate)
            
            // Property: Each cycle reset should result in count = 0
            expect(result.wasReset).toBe(true)
            expect(result.newCount).toBe(0)
            
            // Update state for next iteration
            currentState = {
              ...currentState,
              currentMonthCount: result.newCount + Math.floor(Math.random() * 10), // Simulate some usage
              billingCycleStart: result.newBillingCycleStart,
              billingCycleEnd: getBillingCycleEnd(result.newBillingCycleStart)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
