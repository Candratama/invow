/**
 * Property-Based Test for Pricing Cache Tag Invalidation
 * 
 * **Feature: nextjs16-cache-components, Property 3: Cache Tag Invalidation**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any admin action that updates pricing plans, calling the invalidation
 * function SHALL trigger revalidation of all components tagged with 'pricing'.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

describe('Property 3: Cache Tag Invalidation', () => {
  const cacheInvalidationPath = path.join(process.cwd(), 'lib/cache/invalidation.ts')
  const adminPricingPath = path.join(process.cwd(), 'app/actions/admin-pricing.ts')
  const pricingSectionPath = path.join(process.cwd(), 'components/landing-page/pricing-section.tsx')

  it('should verify cache tags file exports CacheTags with PRICING constant', () => {
    const cacheTagsPath = path.join(process.cwd(), 'lib/cache/tags.ts')
    fc.assert(
      fc.property(
        fc.constant(cacheTagsPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must export CacheTags with PRICING constant
          const hasCacheTagsExport = fileContent.includes('export const CacheTags')
          const hasPricingTag = fileContent.includes("PRICING: 'pricing'") || 
                               fileContent.includes('PRICING: "pricing"')

          expect(hasCacheTagsExport).toBe(true)
          expect(hasPricingTag).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify cache invalidation utility exports invalidatePricingCache function', () => {
    fc.assert(
      fc.property(
        fc.constant(cacheInvalidationPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must export invalidatePricingCache function
          const hasInvalidatePricingCache = 
            fileContent.includes('export async function invalidatePricingCache')

          expect(hasInvalidatePricingCache).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify invalidatePricingCache calls revalidateTag with PRICING tag', () => {
    fc.assert(
      fc.property(
        fc.constant(cacheInvalidationPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: invalidatePricingCache must call revalidateTag with CacheTags.PRICING
          const hasRevalidateTagImport = 
            fileContent.includes('revalidateTag') &&
            fileContent.includes("from 'next/cache'")
          // Next.js 16 requires 2 arguments: revalidateTag(tag, profile)
          const callsRevalidateWithPricing = 
            fileContent.includes("revalidateTag(CacheTags.PRICING, 'max')") ||
            fileContent.includes('revalidateTag(CacheTags.PRICING, "max")')

          expect(hasRevalidateTagImport).toBe(true)
          expect(callsRevalidateWithPricing).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify admin-pricing.ts imports invalidatePricingCache', () => {
    fc.assert(
      fc.property(
        fc.constant(adminPricingPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must import invalidatePricingCache from cache invalidation utility
          const hasInvalidatePricingCacheImport = 
            fileContent.includes('invalidatePricingCache') &&
            fileContent.includes('@/lib/cache/invalidation')

          expect(hasInvalidatePricingCacheImport).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify admin-pricing.ts calls invalidatePricingCache after plan updates', () => {
    fc.assert(
      fc.property(
        fc.constant(adminPricingPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: Must call invalidatePricingCache() after successful plan update
          const callsInvalidatePricingCache = 
            fileContent.includes('invalidatePricingCache()')

          expect(callsInvalidatePricingCache).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify PricingSection uses cacheTag with pricing tag', () => {
    fc.assert(
      fc.property(
        fc.constant(pricingSectionPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: PricingSection must use cacheTag with CacheTags.PRICING
          const hasCacheTagImport = 
            fileContent.includes('cacheTag') &&
            (fileContent.includes("from 'next/cache'") || fileContent.includes('from "next/cache"'))
          const hasCacheTagsImport = 
            fileContent.includes('CacheTags') &&
            (fileContent.includes('@/lib/cache/tags') || fileContent.includes('@/lib/cache/invalidation'))
          const usesCacheTagWithPricing = 
            fileContent.includes('cacheTag(CacheTags.PRICING)')

          expect(hasCacheTagImport).toBe(true)
          expect(hasCacheTagsImport).toBe(true)
          expect(usesCacheTagWithPricing).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify PricingSection has use cache directive', () => {
    fc.assert(
      fc.property(
        fc.constant(pricingSectionPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: PricingSection must have 'use cache' directive at top
          const hasUseCacheDirective = 
            fileContent.startsWith("'use cache'") ||
            fileContent.startsWith('"use cache"')

          expect(hasUseCacheDirective).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify PricingSection uses cacheLife for cache duration', () => {
    fc.assert(
      fc.property(
        fc.constant(pricingSectionPath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8')

          // Property: PricingSection must use cacheLife for cache duration
          const hasCacheLifeImport = 
            fileContent.includes('cacheLife') &&
            (fileContent.includes("from 'next/cache'") || fileContent.includes('from "next/cache"'))
          const usesCacheLifeHours = 
            fileContent.includes("cacheLife('hours')") ||
            fileContent.includes('cacheLife("hours")')

          expect(hasCacheLifeImport).toBe(true)
          expect(usesCacheLifeHours).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
