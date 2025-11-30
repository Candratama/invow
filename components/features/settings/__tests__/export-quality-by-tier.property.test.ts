/**
 * Property-Based Test for Export Quality Options by Tier
 * 
 * **Feature: premium-feature-gating, Property 11: Export quality options by tier**
 * **Validates: Requirements 9.1, 9.2**
 * 
 * Property: For any free user, only 'standard' export quality should be available.
 * For any premium user, all quality options (standard, high, print-ready) should be available.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TIER_FEATURES } from '@/lib/config/pricing'
import { EXPORT_QUALITY_OPTIONS, type ExportQualityOption } from '../invoice-settings-tab'

// Define the tier type
type Tier = 'free' | 'premium'

/**
 * Pure function that returns available export qualities based on tier
 * This mirrors the logic in TierService.getAvailableExportQualities()
 */
function getAvailableExportQualitiesForTier(tier: Tier): string[] {
  const features = TIER_FEATURES[tier]
  
  if (!features) {
    // Unknown tier, default to free tier
    return TIER_FEATURES.free.exportQualities
  }

  return features.exportQualities
}

/**
 * Pure function that determines if a specific export quality option is accessible for a tier
 */
function isExportQualityAccessible(option: ExportQualityOption, tier: Tier): boolean {
  return option.tierRequired === 'free' || tier === 'premium'
}

/**
 * Pure function that returns all accessible export quality options for a tier
 */
function getAccessibleExportOptions(tier: Tier): ExportQualityOption[] {
  return EXPORT_QUALITY_OPTIONS.filter(option => isExportQualityAccessible(option, tier))
}

/**
 * Pure function that returns locked export quality options for a tier
 */
function getLockedExportOptions(tier: Tier): ExportQualityOption[] {
  return EXPORT_QUALITY_OPTIONS.filter(option => !isExportQualityAccessible(option, tier))
}

describe('Property 11: Export quality options by tier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide only standard quality for free users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('free' as Tier),
        async (tier) => {
          const availableQualities = getAvailableExportQualitiesForTier(tier)

          // Free tier should only have 'standard' quality
          expect(availableQualities).toEqual(['standard'])
          expect(availableQualities.length).toBe(1)
          expect(availableQualities).toContain('standard')
          expect(availableQualities).not.toContain('high')
          expect(availableQualities).not.toContain('print-ready')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide all quality options for premium users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('premium' as Tier),
        async (tier) => {
          const availableQualities = getAvailableExportQualitiesForTier(tier)

          // Premium tier should have all three quality options
          expect(availableQualities).toEqual(['standard', 'high', 'print-ready'])
          expect(availableQualities.length).toBe(3)
          expect(availableQualities).toContain('standard')
          expect(availableQualities).toContain('high')
          expect(availableQualities).toContain('print-ready')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have free tier as subset of premium tier qualities', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const freeQualities = getAvailableExportQualitiesForTier('free')
          const premiumQualities = getAvailableExportQualitiesForTier('premium')

          // All free tier qualities should be available in premium tier
          for (const quality of freeQualities) {
            expect(premiumQualities).toContain(quality)
          }

          // Premium should have more options than free
          expect(premiumQualities.length).toBeGreaterThan(freeQualities.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify accessible options for free tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('free' as Tier),
        async (tier) => {
          const accessibleOptions = getAccessibleExportOptions(tier)
          const lockedOptions = getLockedExportOptions(tier)

          // Free tier should have exactly 1 accessible option (standard)
          expect(accessibleOptions.length).toBe(1)
          expect(accessibleOptions[0].id).toBe('standard')
          expect(accessibleOptions[0].tierRequired).toBe('free')

          // Free tier should have 2 locked options (high, print-ready)
          expect(lockedOptions.length).toBe(2)
          expect(lockedOptions.every(opt => opt.tierRequired === 'premium')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify accessible options for premium tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant('premium' as Tier),
        async (tier) => {
          const accessibleOptions = getAccessibleExportOptions(tier)
          const lockedOptions = getLockedExportOptions(tier)

          // Premium tier should have all 3 options accessible
          expect(accessibleOptions.length).toBe(3)
          expect(accessibleOptions.map(opt => opt.id)).toEqual(['standard', 'high', 'print-ready'])

          // Premium tier should have no locked options
          expect(lockedOptions.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should enforce tier-based access for any export quality option', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        fc.constantFrom(...EXPORT_QUALITY_OPTIONS),
        async (tier, option) => {
          const isAccessible = isExportQualityAccessible(option, tier)

          if (tier === 'premium') {
            // Premium users can access all options
            expect(isAccessible).toBe(true)
          } else {
            // Free users can only access options with tierRequired === 'free'
            expect(isAccessible).toBe(option.tierRequired === 'free')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have consistent quality values across options', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Verify each option has expected value mapping
          const standardOption = EXPORT_QUALITY_OPTIONS.find(opt => opt.id === 'standard')
          const highOption = EXPORT_QUALITY_OPTIONS.find(opt => opt.id === 'high')
          const printReadyOption = EXPORT_QUALITY_OPTIONS.find(opt => opt.id === 'print-ready')

          expect(standardOption?.value).toBe(50)
          expect(highOption?.value).toBe(100)
          expect(printReadyOption?.value).toBe(150)

          // Values should be in ascending order
          expect(standardOption!.value).toBeLessThan(highOption!.value)
          expect(highOption!.value).toBeLessThan(printReadyOption!.value)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have all options properly labeled with file size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...EXPORT_QUALITY_OPTIONS),
        async (option) => {
          // Each option should have a label containing the file size
          expect(option.label).toContain('KB')
          expect(option.label).toContain(option.value.toString())

          // Each option should have a description
          expect(option.description.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should default to free tier qualities for unknown tiers', async () => {
    // Reserved JavaScript property names that should be excluded from testing
    const reservedProps = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          s => s !== 'free' && s !== 'premium' && !reservedProps.includes(s)
        ),
        async (unknownTier) => {
          // Test with an unknown tier (cast to bypass type checking)
          const result = getAvailableExportQualitiesForTier(unknownTier as Tier)

          // Should use free tier qualities as fallback
          expect(result).toEqual(TIER_FEATURES.free.exportQualities)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain TIER_FEATURES configuration consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Verify TIER_FEATURES matches EXPORT_QUALITY_OPTIONS
          const freeConfigQualities = TIER_FEATURES.free.exportQualities
          const premiumConfigQualities = TIER_FEATURES.premium.exportQualities

          // Free tier config should match standard option
          expect(freeConfigQualities).toContain('standard')
          expect(freeConfigQualities.length).toBe(1)

          // Premium tier config should match all options
          expect(premiumConfigQualities).toContain('standard')
          expect(premiumConfigQualities).toContain('high')
          expect(premiumConfigQualities).toContain('print-ready')
          expect(premiumConfigQualities.length).toBe(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have standard quality accessible to all tiers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<Tier>('free', 'premium'),
        async (tier) => {
          const accessibleOptions = getAccessibleExportOptions(tier)
          const standardOption = accessibleOptions.find(opt => opt.id === 'standard')

          // Standard quality should always be accessible regardless of tier
          expect(standardOption).toBeDefined()
          expect(standardOption?.tierRequired).toBe('free')
        }
      ),
      { numRuns: 100 }
    )
  })
})
