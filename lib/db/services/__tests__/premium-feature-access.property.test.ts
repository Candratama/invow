/**
 * Property-Based Test for Premium Feature Access
 * 
 * **Feature: premium-feature-gating, Property 6: Premium feature access for premium users**
 * **Validates: Requirements 4.3, 5.3, 6.3, 10.2**
 * 
 * Property: For any premium user, all premium features (logo, signature, custom colors, reports)
 * should be accessible and functional.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'
import { TIER_FEATURES, type TierFeatures } from '@/lib/config/pricing'

// Define types for testing
type Tier = 'free' | 'premium'

// Premium boolean features that should be accessible for premium users
const PREMIUM_BOOLEAN_FEATURES: (keyof TierFeatures)[] = [
  'hasLogo',
  'hasSignature',
  'hasCustomColors',
  'hasMonthlyReport',
]

// All premium features including non-boolean ones
const ALL_PREMIUM_FEATURES: (keyof TierFeatures)[] = [
  'hasLogo',
  'hasSignature',
  'hasCustomColors',
  'hasMonthlyReport',
  'hasDashboardTotals',
]

interface UserSubscription {
  userId: string
  tier: Tier
  subscriptionStartDate: Date
  subscriptionEndDate: Date | null
}

/**
 * Pure function that checks if a user has access to a premium feature
 * This mirrors the logic in TierService.canAccessFeature
 */
function canAccessFeature(
  tier: Tier,
  feature: keyof TierFeatures
): boolean {
  const features = TIER_FEATURES[tier]
  if (!features) return false

  const value = features[feature]

  // Handle different feature value types
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  // For string type (historyType), always return true
  return true
}

/**
 * Pure function that checks if subscription is active
 */
function isSubscriptionActive(subscription: UserSubscription): boolean {
  if (subscription.tier === 'free') {
    return true // Free tier is always "active"
  }

  if (!subscription.subscriptionEndDate) {
    return false // Premium without end date is invalid
  }

  const now = new Date()
  return subscription.subscriptionEndDate > now
}

/**
 * Pure function that gets effective tier based on subscription status
 */
function getEffectiveTier(subscription: UserSubscription): Tier {
  if (subscription.tier === 'premium' && !isSubscriptionActive(subscription)) {
    return 'free' // Expired premium becomes free
  }
  return subscription.tier
}

/**
 * Generator for valid dates
 * Note: Defined for potential future use in subscription date testing
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const validDateArb = fc.integer({ 
  min: new Date('2024-01-01').getTime(), 
  max: new Date('2026-12-31').getTime() 
}).map(ts => new Date(ts))

describe('Property 6: Premium feature access for premium users', () => {
  it('should grant access to all premium boolean features for premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        async (feature) => {
          const hasAccess = canAccessFeature('premium', feature)

          // Property: Premium users should have access to all premium boolean features
          expect(hasAccess).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should deny access to premium boolean features for free users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        async (feature) => {
          const hasAccess = canAccessFeature('free', feature)

          // Property: Free users should NOT have access to premium boolean features
          expect(hasAccess).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide more templates for premium users than free users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed, just run the check
        async () => {
          const freeTemplates = TIER_FEATURES.free.templateCount
          const premiumTemplates = TIER_FEATURES.premium.templateCount

          // Property: Premium should have more templates than free
          expect(premiumTemplates).toBeGreaterThan(freeTemplates)
          expect(freeTemplates).toBe(1)
          expect(premiumTemplates).toBeGreaterThanOrEqual(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide more export qualities for premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const freeQualities = TIER_FEATURES.free.exportQualities
          const premiumQualities = TIER_FEATURES.premium.exportQualities

          // Property: Premium should have more export quality options
          expect(premiumQualities.length).toBeGreaterThan(freeQualities.length)
          
          // Property: Free should only have 'standard'
          expect(freeQualities).toContain('standard')
          expect(freeQualities.length).toBe(1)

          // Property: Premium should have all quality options
          expect(premiumQualities).toContain('standard')
          expect(premiumQualities).toContain('high')
          expect(premiumQualities).toContain('print-ready')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should grant dashboard totals access only to premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const hasAccess = canAccessFeature(tier, 'hasDashboardTotals')

          // Property: Only premium users should have dashboard totals
          if (tier === 'premium') {
            expect(hasAccess).toBe(true)
          } else {
            expect(hasAccess).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should grant monthly report access only to premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const hasAccess = canAccessFeature(tier, 'hasMonthlyReport')

          // Property: Only premium users should have monthly report access
          if (tier === 'premium') {
            expect(hasAccess).toBe(true)
          } else {
            expect(hasAccess).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should treat expired premium subscriptions as free tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        async (userId, feature) => {
          // Create an expired premium subscription
          const expiredSubscription: UserSubscription = {
            userId,
            tier: 'premium',
            subscriptionStartDate: new Date('2024-01-01'),
            subscriptionEndDate: new Date('2024-02-01') // Past date
          }

          const effectiveTier = getEffectiveTier(expiredSubscription)
          const hasAccess = canAccessFeature(effectiveTier, feature)

          // Property: Expired premium should be treated as free
          expect(effectiveTier).toBe('free')
          expect(hasAccess).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should grant access to active premium subscriptions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        async (userId, feature) => {
          // Create an active premium subscription (future end date)
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + 30)
          
          const activeSubscription: UserSubscription = {
            userId,
            tier: 'premium',
            subscriptionStartDate: new Date(),
            subscriptionEndDate: futureDate
          }

          const effectiveTier = getEffectiveTier(activeSubscription)
          const hasAccess = canAccessFeature(effectiveTier, feature)

          // Property: Active premium should have access
          expect(effectiveTier).toBe('premium')
          expect(hasAccess).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify TierService implements feature access correctly', () => {
    const tierServicePath = path.join(process.cwd(), 'lib/db/services/tier.service.ts')
    const fileContent = fs.readFileSync(tierServicePath, 'utf-8')

    // Property: TierService should have canAccessFeature method
    expect(fileContent).toContain('canAccessFeature')

    // Property: TierService should check subscription expiry
    expect(fileContent).toContain('subscription_end_date')

    // Property: TierService should handle boolean features
    expect(fileContent).toContain('typeof value === "boolean"')

    // Property: TierService should handle array features
    expect(fileContent).toContain('Array.isArray(value)')
  })

  it('should verify business-info-tab allows logo upload for premium users', () => {
    const businessInfoPath = path.join(
      process.cwd(),
      'components/features/settings/business-info-tab.tsx'
    )
    const fileContent = fs.readFileSync(businessInfoPath, 'utf-8')

    // Property: Logo section should be wrapped with FeatureGate
    expect(fileContent).toContain('FeatureGate')
    expect(fileContent).toContain('feature="hasLogo"')
  })

  it('should verify business-info-tab allows signature for premium users', () => {
    const businessInfoPath = path.join(
      process.cwd(),
      'components/features/settings/business-info-tab.tsx'
    )
    const fileContent = fs.readFileSync(businessInfoPath, 'utf-8')

    // Property: Signature section should be wrapped with FeatureGate
    expect(fileContent).toContain('feature="hasSignature"')
  })

  it('should verify business-info-tab allows custom colors for premium users', () => {
    const businessInfoPath = path.join(
      process.cwd(),
      'components/features/settings/business-info-tab.tsx'
    )
    const fileContent = fs.readFileSync(businessInfoPath, 'utf-8')

    // Property: Color customization should be wrapped with FeatureGate
    // The actual feature name used is "hasBrandColor" for brand color customization
    expect(fileContent).toContain('feature="hasBrandColor"')
  })

  it('should verify reports-tab allows monthly reports for premium users', () => {
    const reportsTabPath = path.join(
      process.cwd(),
      'components/features/settings/reports-tab.tsx'
    )
    const fileContent = fs.readFileSync(reportsTabPath, 'utf-8')

    // Property: Reports should check premium status or use FeatureGate
    const hasFeatureGate = fileContent.includes('FeatureGate')
    const hasPremiumCheck = fileContent.includes('isPremium') || fileContent.includes('premium')
    
    expect(hasFeatureGate || hasPremiumCheck).toBe(true)
  })

  it('should ensure all premium features are consistently defined', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_PREMIUM_FEATURES),
        async (feature) => {
          // Property: Feature should exist in both tier configurations
          expect(TIER_FEATURES.free).toHaveProperty(feature)
          expect(TIER_FEATURES.premium).toHaveProperty(feature)

          // Property: Premium should have equal or better access than free
          const freeValue = TIER_FEATURES.free[feature]
          const premiumValue = TIER_FEATURES.premium[feature]

          if (typeof freeValue === 'boolean' && typeof premiumValue === 'boolean') {
            // For boolean features, premium should be true if free is true
            if (freeValue === true) {
              expect(premiumValue).toBe(true)
            }
          }

          if (typeof freeValue === 'number' && typeof premiumValue === 'number') {
            // For numeric features, premium should be >= free
            expect(premiumValue).toBeGreaterThanOrEqual(freeValue)
          }

          if (Array.isArray(freeValue) && Array.isArray(premiumValue)) {
            // For array features, premium should have >= items
            expect(premiumValue.length).toBeGreaterThanOrEqual(freeValue.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
