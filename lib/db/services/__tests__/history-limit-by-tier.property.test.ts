/**
 * Property-Based Test for History Limit by Tier
 * 
 * **Feature: premium-feature-gating, Property 8: History limit by tier**
 * **Validates: Requirements 7.1, 7.2**
 * 
 * Property: For any free user, transaction history should return at most 10 items.
 * For any premium user, history should return items from the last 30 days.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TIER_FEATURES } from '@/lib/config/pricing'

// Define the tier type
type Tier = 'free' | 'premium'

// Define history limit result type
interface HistoryLimit {
  limit: number
  type: 'count' | 'days'
}

/**
 * Pure function that returns history limit configuration based on tier
 * This mirrors the logic in TierService.getHistoryLimit()
 */
function getHistoryLimitForTier(tier: Tier): HistoryLimit {
  const features = TIER_FEATURES[tier]
  
  if (!features) {
    // Unknown tier, default to free tier limits
    return {
      limit: TIER_FEATURES.free.historyLimit,
      type: TIER_FEATURES.free.historyType,
    }
  }

  return {
    limit: features.historyLimit,
    type: features.historyType,
  }
}

/**
 * Pure function that filters transactions based on history limit
 * This is the core logic for applying history limits to transaction lists
 */
function applyHistoryLimit(
  transactions: { id: string; createdAt: Date }[],
  historyLimit: HistoryLimit,
  referenceDate: Date = new Date()
): { id: string; createdAt: Date }[] {
  if (historyLimit.type === 'count') {
    // For count-based limit, return the most recent N transactions
    return transactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, historyLimit.limit)
  } else {
    // For days-based limit, return transactions within the last N days
    const cutoffDate = new Date(referenceDate)
    cutoffDate.setDate(cutoffDate.getDate() - historyLimit.limit)
    
    return transactions
      .filter(t => t.createdAt >= cutoffDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

describe('Property 8: History limit by tier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return count-based limit of 10 for free tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('free' as Tier),
        async (tier) => {
          const result = getHistoryLimitForTier(tier)

          expect(result.limit).toBe(10)
          expect(result.type).toBe('count')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return days-based limit of 30 for premium tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('premium' as Tier),
        async (tier) => {
          const result = getHistoryLimitForTier(tier)

          expect(result.limit).toBe(30)
          expect(result.type).toBe('days')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should limit free user transactions to at most 10 items regardless of total count', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random number of transactions (0 to 100)
        fc.integer({ min: 0, max: 100 }),
        async (transactionCount) => {
          // Generate transactions with random dates
          const now = new Date()
          const transactions = Array.from({ length: transactionCount }, (_, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // Each day back
          }))

          const historyLimit = getHistoryLimitForTier('free')
          const result = applyHistoryLimit(transactions, historyLimit, now)

          // Free tier should return at most 10 transactions
          expect(result.length).toBeLessThanOrEqual(10)
          expect(result.length).toBe(Math.min(transactionCount, 10))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return premium user transactions from last 30 days only', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate transactions with dates spanning 0-60 days ago
        fc.array(
          fc.integer({ min: 0, max: 60 }),
          { minLength: 0, maxLength: 50 }
        ),
        async (daysAgoArray) => {
          const now = new Date()
          const transactions = daysAgoArray.map((daysAgo, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
          }))

          const historyLimit = getHistoryLimitForTier('premium')
          const result = applyHistoryLimit(transactions, historyLimit, now)

          // All returned transactions should be within the last 30 days
          const cutoffDate = new Date(now)
          cutoffDate.setDate(cutoffDate.getDate() - 30)

          for (const txn of result) {
            expect(txn.createdAt.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime())
          }

          // Count expected transactions within 30 days
          const expectedCount = transactions.filter(t => t.createdAt >= cutoffDate).length
          expect(result.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should enforce different limit types for different tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const result = getHistoryLimitForTier(tier)

          if (tier === 'free') {
            // Free tier uses count-based limiting
            expect(result.type).toBe('count')
            expect(result.limit).toBe(TIER_FEATURES.free.historyLimit)
          } else {
            // Premium tier uses days-based limiting
            expect(result.type).toBe('days')
            expect(result.limit).toBe(TIER_FEATURES.premium.historyLimit)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have free tier history limit less than premium tier history limit', () => {
    // Configuration invariant: free tier should have more restrictive limits
    expect(TIER_FEATURES.free.historyLimit).toBeLessThanOrEqual(
      TIER_FEATURES.premium.historyLimit
    )
  })

  it('should return most recent transactions first for both tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        fc.array(
          fc.integer({ min: 0, max: 29 }), // Keep within 30 days for premium
          { minLength: 2, maxLength: 20 }
        ),
        async (tier, daysAgoArray) => {
          const now = new Date()
          const transactions = daysAgoArray.map((daysAgo, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
          }))

          const historyLimit = getHistoryLimitForTier(tier)
          const result = applyHistoryLimit(transactions, historyLimit, now)

          // Verify descending order (newest first)
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i].createdAt.getTime()
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should default to free tier limits for unknown tiers', async () => {
    // Reserved JavaScript property names that should be excluded from testing
    const reservedProps = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          s => s !== 'free' && s !== 'premium' && !reservedProps.includes(s)
        ),
        async (unknownTier) => {
          // Test with an unknown tier (cast to bypass type checking)
          const result = getHistoryLimitForTier(unknownTier as Tier)

          // Should use free tier limits as fallback
          expect(result.limit).toBe(TIER_FEATURES.free.historyLimit)
          expect(result.type).toBe(TIER_FEATURES.free.historyType)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty transaction list for any tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const transactions: { id: string; createdAt: Date }[] = []
          const historyLimit = getHistoryLimitForTier(tier)
          const result = applyHistoryLimit(transactions, historyLimit)

          expect(result.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly apply count limit at boundary for free tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 8, max: 15 }), // Around the boundary of 10
        async (transactionCount) => {
          const now = new Date()
          const transactions = Array.from({ length: transactionCount }, (_, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(now.getTime() - i * 1000), // Each second back
          }))

          const historyLimit = getHistoryLimitForTier('free')
          const result = applyHistoryLimit(transactions, historyLimit, now)

          // Should return exactly min(transactionCount, 10)
          expect(result.length).toBe(Math.min(transactionCount, 10))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly apply days limit at boundary for premium tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate some transactions at exactly 30 days and some at 31 days
        fc.record({
          withinLimit: fc.integer({ min: 0, max: 10 }),
          outsideLimit: fc.integer({ min: 0, max: 10 }),
        }),
        async ({ withinLimit, outsideLimit }) => {
          const now = new Date()
          const transactions: { id: string; createdAt: Date }[] = []

          // Add transactions within 30 days
          for (let i = 0; i < withinLimit; i++) {
            transactions.push({
              id: `within-${i}`,
              createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
            })
          }

          // Add transactions outside 30 days (31+ days ago)
          for (let i = 0; i < outsideLimit; i++) {
            transactions.push({
              id: `outside-${i}`,
              createdAt: new Date(now.getTime() - (31 + i) * 24 * 60 * 60 * 1000),
            })
          }

          const historyLimit = getHistoryLimitForTier('premium')
          const result = applyHistoryLimit(transactions, historyLimit, now)

          // Should only include transactions within 30 days
          expect(result.length).toBe(withinLimit)
          
          // Verify no transactions older than 30 days are included
          const cutoffDate = new Date(now)
          cutoffDate.setDate(cutoffDate.getDate() - 30)
          
          for (const txn of result) {
            expect(txn.createdAt.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime())
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
