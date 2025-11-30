/**
 * Property-Based Test for Dashboard Data by Tier
 * 
 * **Feature: premium-feature-gating, Property 10: Dashboard data by tier**
 * **Validates: Requirements 8.1, 8.2**
 * 
 * Property: For any free user, dashboard should show only current month data.
 * For any premium user, dashboard should include total invoice count and total revenue.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TIER_FEATURES } from '@/lib/config/pricing'

// Define the tier type
type Tier = 'free' | 'premium'

// Define revenue metrics type (mirrors RevenueMetrics from lib/utils/revenue.ts)
interface RevenueMetrics {
  totalRevenue: number
  monthlyRevenue: number
  invoiceCount: number
  monthlyInvoiceCount: number
  averageOrderValue: number
  monthlyAverageOrderValue: number
}

// Define dashboard display data type
interface DashboardDisplayData {
  // Always shown
  monthlyInvoiceCount: number
  // Premium only
  monthlyRevenue?: number
  totalRevenue?: number
  totalInvoiceCount?: number
  showPremiumTeaser: boolean
}

/**
 * Pure function that determines what dashboard data to display based on tier
 * This mirrors the logic in RevenueCards component
 */
function getDashboardDisplayData(
  tier: Tier,
  metrics: RevenueMetrics
): DashboardDisplayData {
  const isPremium = tier === 'premium'
  const features = TIER_FEATURES[tier]

  if (isPremium && features?.hasDashboardTotals) {
    // Premium users see all data
    return {
      monthlyInvoiceCount: metrics.monthlyInvoiceCount,
      monthlyRevenue: metrics.monthlyRevenue,
      totalRevenue: metrics.totalRevenue,
      totalInvoiceCount: metrics.invoiceCount,
      showPremiumTeaser: false,
    }
  } else {
    // Free users see only current month count
    return {
      monthlyInvoiceCount: metrics.monthlyInvoiceCount,
      showPremiumTeaser: true,
    }
  }
}

/**
 * Pure function that checks if tier has dashboard totals feature
 */
function hasDashboardTotalsFeature(tier: Tier): boolean {
  const features = TIER_FEATURES[tier]
  return features?.hasDashboardTotals ?? false
}

describe('Property 10: Dashboard data by tier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show only monthly invoice count for free users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random revenue metrics
        fc.record({
          totalRevenue: fc.integer({ min: 0, max: 100000000 }),
          monthlyRevenue: fc.integer({ min: 0, max: 10000000 }),
          invoiceCount: fc.integer({ min: 0, max: 1000 }),
          monthlyInvoiceCount: fc.integer({ min: 0, max: 100 }),
          averageOrderValue: fc.integer({ min: 0, max: 1000000 }),
          monthlyAverageOrderValue: fc.integer({ min: 0, max: 1000000 }),
        }),
        async (metrics) => {
          const result = getDashboardDisplayData('free', metrics)

          // Free users should see monthly invoice count
          expect(result.monthlyInvoiceCount).toBe(metrics.monthlyInvoiceCount)
          
          // Free users should NOT see revenue or total data
          expect(result.monthlyRevenue).toBeUndefined()
          expect(result.totalRevenue).toBeUndefined()
          expect(result.totalInvoiceCount).toBeUndefined()
          
          // Free users should see premium teaser
          expect(result.showPremiumTeaser).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show total invoice count and total revenue for premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random revenue metrics
        fc.record({
          totalRevenue: fc.integer({ min: 0, max: 100000000 }),
          monthlyRevenue: fc.integer({ min: 0, max: 10000000 }),
          invoiceCount: fc.integer({ min: 0, max: 1000 }),
          monthlyInvoiceCount: fc.integer({ min: 0, max: 100 }),
          averageOrderValue: fc.integer({ min: 0, max: 1000000 }),
          monthlyAverageOrderValue: fc.integer({ min: 0, max: 1000000 }),
        }),
        async (metrics) => {
          const result = getDashboardDisplayData('premium', metrics)

          // Premium users should see all data
          expect(result.monthlyInvoiceCount).toBe(metrics.monthlyInvoiceCount)
          expect(result.monthlyRevenue).toBe(metrics.monthlyRevenue)
          expect(result.totalRevenue).toBe(metrics.totalRevenue)
          expect(result.totalInvoiceCount).toBe(metrics.invoiceCount)
          
          // Premium users should NOT see premium teaser
          expect(result.showPremiumTeaser).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have hasDashboardTotals feature enabled only for premium tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const hasFeature = hasDashboardTotalsFeature(tier)

          if (tier === 'free') {
            expect(hasFeature).toBe(false)
          } else {
            expect(hasFeature).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show premium teaser for free users regardless of metrics values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate edge case metrics (zero, very large, etc.)
        fc.oneof(
          // Zero metrics
          fc.constant({
            totalRevenue: 0,
            monthlyRevenue: 0,
            invoiceCount: 0,
            monthlyInvoiceCount: 0,
            averageOrderValue: 0,
            monthlyAverageOrderValue: 0,
          }),
          // Large metrics
          fc.record({
            totalRevenue: fc.integer({ min: 10000000, max: 100000000 }),
            monthlyRevenue: fc.integer({ min: 1000000, max: 10000000 }),
            invoiceCount: fc.integer({ min: 100, max: 1000 }),
            monthlyInvoiceCount: fc.integer({ min: 10, max: 100 }),
            averageOrderValue: fc.integer({ min: 100000, max: 1000000 }),
            monthlyAverageOrderValue: fc.integer({ min: 100000, max: 1000000 }),
          })
        ),
        async (metrics) => {
          const result = getDashboardDisplayData('free', metrics)

          // Free users should always see premium teaser
          expect(result.showPremiumTeaser).toBe(true)
          
          // And should never see total data
          expect(result.totalRevenue).toBeUndefined()
          expect(result.totalInvoiceCount).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not show premium teaser for premium users regardless of metrics values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate edge case metrics
        fc.oneof(
          // Zero metrics
          fc.constant({
            totalRevenue: 0,
            monthlyRevenue: 0,
            invoiceCount: 0,
            monthlyInvoiceCount: 0,
            averageOrderValue: 0,
            monthlyAverageOrderValue: 0,
          }),
          // Random metrics
          fc.record({
            totalRevenue: fc.integer({ min: 0, max: 100000000 }),
            monthlyRevenue: fc.integer({ min: 0, max: 10000000 }),
            invoiceCount: fc.integer({ min: 0, max: 1000 }),
            monthlyInvoiceCount: fc.integer({ min: 0, max: 100 }),
            averageOrderValue: fc.integer({ min: 0, max: 1000000 }),
            monthlyAverageOrderValue: fc.integer({ min: 0, max: 1000000 }),
          })
        ),
        async (metrics) => {
          const result = getDashboardDisplayData('premium', metrics)

          // Premium users should never see premium teaser
          expect(result.showPremiumTeaser).toBe(false)
          
          // And should always see total data
          expect(result.totalRevenue).toBeDefined()
          expect(result.totalInvoiceCount).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve monthly invoice count for both tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        fc.integer({ min: 0, max: 1000 }),
        async (tier, monthlyCount) => {
          const metrics: RevenueMetrics = {
            totalRevenue: 1000000,
            monthlyRevenue: 500000,
            invoiceCount: 50,
            monthlyInvoiceCount: monthlyCount,
            averageOrderValue: 20000,
            monthlyAverageOrderValue: 25000,
          }

          const result = getDashboardDisplayData(tier, metrics)

          // Both tiers should see monthly invoice count
          expect(result.monthlyInvoiceCount).toBe(monthlyCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify TIER_FEATURES configuration for dashboard totals', () => {
    // Configuration invariant: free tier should not have dashboard totals
    expect(TIER_FEATURES.free.hasDashboardTotals).toBe(false)
    
    // Configuration invariant: premium tier should have dashboard totals
    expect(TIER_FEATURES.premium.hasDashboardTotals).toBe(true)
  })

  it('should correctly differentiate data visibility between tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalRevenue: fc.integer({ min: 1, max: 100000000 }),
          monthlyRevenue: fc.integer({ min: 1, max: 10000000 }),
          invoiceCount: fc.integer({ min: 1, max: 1000 }),
          monthlyInvoiceCount: fc.integer({ min: 1, max: 100 }),
          averageOrderValue: fc.integer({ min: 1, max: 1000000 }),
          monthlyAverageOrderValue: fc.integer({ min: 1, max: 1000000 }),
        }),
        async (metrics) => {
          const freeResult = getDashboardDisplayData('free', metrics)
          const premiumResult = getDashboardDisplayData('premium', metrics)

          // Both should have same monthly invoice count
          expect(freeResult.monthlyInvoiceCount).toBe(premiumResult.monthlyInvoiceCount)

          // Free should have fewer defined fields than premium
          const freeDefinedFields = Object.values(freeResult).filter(v => v !== undefined).length
          const premiumDefinedFields = Object.values(premiumResult).filter(v => v !== undefined).length
          
          expect(freeDefinedFields).toBeLessThan(premiumDefinedFields)

          // Premium should have total data, free should not
          expect(premiumResult.totalRevenue).toBeDefined()
          expect(premiumResult.totalInvoiceCount).toBeDefined()
          expect(freeResult.totalRevenue).toBeUndefined()
          expect(freeResult.totalInvoiceCount).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
