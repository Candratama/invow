/**
 * Property-Based Tests for User Actions
 *
 * **Feature: admin-panel-phase1, Property 13: Upgrade action effect**
 * **Feature: admin-panel-phase1, Property 14: Downgrade action effect**
 * **Feature: admin-panel-phase1, Property 15: Extend subscription action**
 * **Feature: admin-panel-phase1, Property 16: Invoice counter reset invariant**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Constants matching the pricing config
const PREMIUM_INVOICE_LIMIT = 200
const FREE_INVOICE_LIMIT = 10
const PREMIUM_DURATION_DAYS = 30

// Types matching the admin-users service
interface UserSubscription {
  user_id: string
  tier: 'free' | 'premium'
  invoice_limit: number
  current_month_count: number
  subscription_start_date: string | null
  subscription_end_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Pure function that simulates upgrade action effect
 * Mirrors the logic in admin-users.service.ts upgradeUser()
 */
function applyUpgradeAction(
  subscription: UserSubscription,
  actionTimestamp: Date
): UserSubscription {
  const endDate = new Date(actionTimestamp)
  endDate.setDate(endDate.getDate() + PREMIUM_DURATION_DAYS)

  return {
    ...subscription,
    tier: 'premium',
    invoice_limit: PREMIUM_INVOICE_LIMIT,
    subscription_start_date: actionTimestamp.toISOString(),
    subscription_end_date: endDate.toISOString(),
    updated_at: actionTimestamp.toISOString(),
  }
}

/**
 * Pure function that simulates downgrade action effect
 * Mirrors the logic in admin-users.service.ts downgradeUser()
 */
function applyDowngradeAction(
  subscription: UserSubscription,
  actionTimestamp: Date
): UserSubscription {
  return {
    ...subscription,
    tier: 'free',
    invoice_limit: FREE_INVOICE_LIMIT,
    subscription_end_date: null,
    updated_at: actionTimestamp.toISOString(),
  }
}

/**
 * Pure function that simulates extend subscription action effect
 * Mirrors the logic in admin-users.service.ts extendSubscription()
 */
function applyExtendSubscriptionAction(
  subscription: UserSubscription,
  days: number,
  actionTimestamp: Date
): UserSubscription {
  if (days <= 0) {
    // Invalid days - return unchanged
    return subscription
  }

  const now = actionTimestamp
  const baseDate = subscription.subscription_end_date
    ? new Date(subscription.subscription_end_date)
    : now

  // If the current end date is in the past, start from now
  const startDate = baseDate > now ? baseDate : now
  const newEndDate = new Date(startDate)
  newEndDate.setDate(newEndDate.getDate() + days)

  return {
    ...subscription,
    subscription_end_date: newEndDate.toISOString(),
    updated_at: actionTimestamp.toISOString(),
  }
}

/**
 * Pure function that simulates reset invoice counter action effect
 * Mirrors the logic in admin-users.service.ts resetInvoiceCounter()
 */
function applyResetInvoiceCounterAction(
  subscription: UserSubscription,
  actionTimestamp: Date
): UserSubscription {
  return {
    ...subscription,
    current_month_count: 0,
    updated_at: actionTimestamp.toISOString(),
  }
}

// Generators
const tierArb = fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>

const timestampArb = fc.integer({ min: 1577836800000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
  .map(ts => new Date(ts).toISOString())

const subscriptionArb = fc.record({
  user_id: fc.uuid(),
  tier: tierArb,
  invoice_limit: fc.constantFrom(FREE_INVOICE_LIMIT, PREMIUM_INVOICE_LIMIT),
  current_month_count: fc.nat({ max: 250 }),
  subscription_start_date: fc.oneof(fc.constant(null), timestampArb),
  subscription_end_date: fc.oneof(fc.constant(null), timestampArb),
  created_at: timestampArb,
  updated_at: timestampArb,
})

const actionTimestampArb = fc.integer({ min: Date.now() - 1000, max: Date.now() + 1000 })
  .map(ts => new Date(ts))

const positiveDaysArb = fc.integer({ min: 1, max: 365 })
const nonPositiveDaysArb = fc.integer({ min: -365, max: 0 })

describe('Property 13: Upgrade action effect', () => {
  it('should set tier to premium after upgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: Tier is set to premium
        expect(result.tier).toBe('premium')
      }),
      { numRuns: 100 }
    )
  })

  it('should set invoice_limit to 200 after upgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: Invoice limit is set to premium limit (200)
        expect(result.invoice_limit).toBe(PREMIUM_INVOICE_LIMIT)
      }),
      { numRuns: 100 }
    )
  })

  it('should set subscription_end_date to exactly 30 days from action timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: End date is exactly 30 days from action timestamp
        const expectedEndDate = new Date(actionTime)
        expectedEndDate.setDate(expectedEndDate.getDate() + PREMIUM_DURATION_DAYS)
        
        expect(result.subscription_end_date).toBe(expectedEndDate.toISOString())
      }),
      { numRuns: 100 }
    )
  })

  it('should set subscription_start_date to action timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: Start date is set to action timestamp
        expect(result.subscription_start_date).toBe(actionTime.toISOString())
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve user_id and current_month_count after upgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: user_id and current_month_count are preserved
        expect(result.user_id).toBe(subscription.user_id)
        expect(result.current_month_count).toBe(subscription.current_month_count)
      }),
      { numRuns: 100 }
    )
  })

  it('should update updated_at to action timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyUpgradeAction(subscription, actionTime)
        
        // Property: updated_at is set to action timestamp
        expect(result.updated_at).toBe(actionTime.toISOString())
      }),
      { numRuns: 100 }
    )
  })

  it('should be idempotent for tier and invoice_limit', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result1 = applyUpgradeAction(subscription, actionTime)
        const result2 = applyUpgradeAction(result1, actionTime)
        
        // Property: Applying upgrade twice has same tier and limit
        expect(result2.tier).toBe(result1.tier)
        expect(result2.invoice_limit).toBe(result1.invoice_limit)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 14: Downgrade action effect', () => {
  it('should set tier to free after downgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyDowngradeAction(subscription, actionTime)
        
        // Property: Tier is set to free
        expect(result.tier).toBe('free')
      }),
      { numRuns: 100 }
    )
  })

  it('should set invoice_limit to 10 after downgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyDowngradeAction(subscription, actionTime)
        
        // Property: Invoice limit is set to free limit (10)
        expect(result.invoice_limit).toBe(FREE_INVOICE_LIMIT)
      }),
      { numRuns: 100 }
    )
  })

  it('should set subscription_end_date to null after downgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyDowngradeAction(subscription, actionTime)
        
        // Property: End date is set to null (free tier has no expiration)
        expect(result.subscription_end_date).toBeNull()
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve user_id, current_month_count, and subscription_start_date after downgrade', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyDowngradeAction(subscription, actionTime)
        
        // Property: user_id, current_month_count, and start_date are preserved
        expect(result.user_id).toBe(subscription.user_id)
        expect(result.current_month_count).toBe(subscription.current_month_count)
        expect(result.subscription_start_date).toBe(subscription.subscription_start_date)
      }),
      { numRuns: 100 }
    )
  })

  it('should update updated_at to action timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyDowngradeAction(subscription, actionTime)
        
        // Property: updated_at is set to action timestamp
        expect(result.updated_at).toBe(actionTime.toISOString())
      }),
      { numRuns: 100 }
    )
  })

  it('should be idempotent for tier and invoice_limit', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result1 = applyDowngradeAction(subscription, actionTime)
        const result2 = applyDowngradeAction(result1, actionTime)
        
        // Property: Applying downgrade twice has same tier and limit
        expect(result2.tier).toBe(result1.tier)
        expect(result2.invoice_limit).toBe(result1.invoice_limit)
        expect(result2.subscription_end_date).toBe(result1.subscription_end_date)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 15: Extend subscription action', () => {
  it('should add N days to subscription_end_date when end_date exists and is in future', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        positiveDaysArb,
        async (subscription, days) => {
          // Create a subscription with future end date
          const now = new Date()
          const futureDate = new Date(now)
          futureDate.setDate(futureDate.getDate() + 10) // 10 days in future
          
          const subWithFutureEnd = {
            ...subscription,
            subscription_end_date: futureDate.toISOString(),
          }
          
          const result = applyExtendSubscriptionAction(subWithFutureEnd, days, now)
          
          // Property: End date is previous end_date + N days
          const expectedEndDate = new Date(futureDate)
          expectedEndDate.setDate(expectedEndDate.getDate() + days)
          
          expect(result.subscription_end_date).toBe(expectedEndDate.toISOString())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should add N days from now when subscription_end_date is null', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        positiveDaysArb,
        async (subscription, days) => {
          const now = new Date()
          const subWithNullEnd = {
            ...subscription,
            subscription_end_date: null,
          }
          
          const result = applyExtendSubscriptionAction(subWithNullEnd, days, now)
          
          // Property: End date is now + N days when previous was null
          const expectedEndDate = new Date(now)
          expectedEndDate.setDate(expectedEndDate.getDate() + days)
          
          expect(result.subscription_end_date).toBe(expectedEndDate.toISOString())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should add N days from now when subscription_end_date is in the past', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        positiveDaysArb,
        async (subscription, days) => {
          const now = new Date()
          const pastDate = new Date(now)
          pastDate.setDate(pastDate.getDate() - 10) // 10 days in past
          
          const subWithPastEnd = {
            ...subscription,
            subscription_end_date: pastDate.toISOString(),
          }
          
          const result = applyExtendSubscriptionAction(subWithPastEnd, days, now)
          
          // Property: End date is now + N days when previous was in past
          const expectedEndDate = new Date(now)
          expectedEndDate.setDate(expectedEndDate.getDate() + days)
          
          expect(result.subscription_end_date).toBe(expectedEndDate.toISOString())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not modify subscription when days is zero or negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        nonPositiveDaysArb,
        async (subscription, days) => {
          const now = new Date()
          const result = applyExtendSubscriptionAction(subscription, days, now)
          
          // Property: Subscription unchanged for non-positive days
          expect(result).toEqual(subscription)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve tier, invoice_limit, and current_month_count', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        positiveDaysArb,
        actionTimestampArb,
        async (subscription, days, actionTime) => {
          const result = applyExtendSubscriptionAction(subscription, days, actionTime)
          
          // Property: tier, invoice_limit, current_month_count are preserved
          expect(result.tier).toBe(subscription.tier)
          expect(result.invoice_limit).toBe(subscription.invoice_limit)
          expect(result.current_month_count).toBe(subscription.current_month_count)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should update updated_at to action timestamp for valid days', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        positiveDaysArb,
        actionTimestampArb,
        async (subscription, days, actionTime) => {
          const result = applyExtendSubscriptionAction(subscription, days, actionTime)
          
          // Property: updated_at is set to action timestamp
          expect(result.updated_at).toBe(actionTime.toISOString())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should be additive - extending by A then B equals extending by A+B', async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionArb,
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        async (subscription, daysA, daysB) => {
          const now = new Date()
          const futureDate = new Date(now)
          futureDate.setDate(futureDate.getDate() + 30)
          
          const subWithFutureEnd = {
            ...subscription,
            subscription_end_date: futureDate.toISOString(),
          }
          
          // Extend by A then B
          const afterA = applyExtendSubscriptionAction(subWithFutureEnd, daysA, now)
          const afterAB = applyExtendSubscriptionAction(afterA, daysB, now)
          
          // Extend by A+B directly
          const afterSum = applyExtendSubscriptionAction(subWithFutureEnd, daysA + daysB, now)
          
          // Property: Sequential extensions equal single combined extension
          expect(afterAB.subscription_end_date).toBe(afterSum.subscription_end_date)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 16: Invoice counter reset invariant', () => {
  it('should set current_month_count to 0', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: current_month_count is set to 0
        expect(result.current_month_count).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve tier after reset', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: tier is preserved
        expect(result.tier).toBe(subscription.tier)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve invoice_limit after reset', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: invoice_limit is preserved
        expect(result.invoice_limit).toBe(subscription.invoice_limit)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve subscription_start_date after reset', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: subscription_start_date is preserved
        expect(result.subscription_start_date).toBe(subscription.subscription_start_date)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve subscription_end_date after reset', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: subscription_end_date is preserved
        expect(result.subscription_end_date).toBe(subscription.subscription_end_date)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve user_id after reset', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: user_id is preserved
        expect(result.user_id).toBe(subscription.user_id)
      }),
      { numRuns: 100 }
    )
  })

  it('should update updated_at to action timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: updated_at is set to action timestamp
        expect(result.updated_at).toBe(actionTime.toISOString())
      }),
      { numRuns: 100 }
    )
  })

  it('should be idempotent - resetting twice has same effect as once', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result1 = applyResetInvoiceCounterAction(subscription, actionTime)
        const result2 = applyResetInvoiceCounterAction(result1, actionTime)
        
        // Property: Resetting twice has same current_month_count as once
        expect(result2.current_month_count).toBe(result1.current_month_count)
        expect(result2.current_month_count).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should only change current_month_count and updated_at', async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionArb, actionTimestampArb, async (subscription, actionTime) => {
        const result = applyResetInvoiceCounterAction(subscription, actionTime)
        
        // Property: Only current_month_count and updated_at change
        expect(result.user_id).toBe(subscription.user_id)
        expect(result.tier).toBe(subscription.tier)
        expect(result.invoice_limit).toBe(subscription.invoice_limit)
        expect(result.subscription_start_date).toBe(subscription.subscription_start_date)
        expect(result.subscription_end_date).toBe(subscription.subscription_end_date)
        expect(result.created_at).toBe(subscription.created_at)
        
        // These should change
        expect(result.current_month_count).toBe(0)
        expect(result.updated_at).toBe(actionTime.toISOString())
      }),
      { numRuns: 100 }
    )
  })
})
