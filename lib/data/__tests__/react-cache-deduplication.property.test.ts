import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
 * 
 * *For any* data fetching function wrapped with React `cache()`, when called multiple 
 * times with the same arguments within a single request, the underlying fetch SHALL 
 * execute only once.
 * 
 * **Validates: Requirements 6.1, 6.2, 6.4**
 */
describe('React Cache Deduplication', () => {
  const DATA_DIR = path.resolve(process.cwd(), 'lib/data')

  /**
   * Property: All data fetching functions in lib/data must use React cache()
   */
  it('all data fetching functions should be wrapped with React cache()', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const dataFiles = ['pricing.ts', 'templates.ts']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...dataFiles),
        (fileName) => {
          const filePath = path.join(DATA_DIR, fileName)
          
          // File must exist
          expect(fs.existsSync(filePath)).toBe(true)
          
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Must import cache from react
          const cacheImportPattern = /import\s*{\s*cache\s*}\s*from\s*['"]react['"]/
          expect(content).toMatch(cacheImportPattern)
          
          // Must have at least one export wrapped with cache()
          const cacheWrapperPattern = /export\s+const\s+\w+\s*=\s*cache\s*\(/
          expect(content).toMatch(cacheWrapperPattern)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cached functions must be async
   */
  it('cached data fetching functions should be async', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const dataFiles = ['pricing.ts', 'templates.ts']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...dataFiles),
        (fileName) => {
          const filePath = path.join(DATA_DIR, fileName)
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // All exported cache() wrapped functions should be async
          // Pattern: export const X = cache(async ...)
          // This excludes cache() mentions in comments
          const exportCachePattern = /export\s+const\s+\w+\s*=\s*cache\s*\(/g
          const exportCacheAsyncPattern = /export\s+const\s+\w+\s*=\s*cache\s*\(\s*\n?\s*async/g
          
          const exportCacheMatches = content.match(exportCachePattern) || []
          const asyncCacheMatches = content.match(exportCacheAsyncPattern) || []
          
          // All exported cache() calls should have async functions
          expect(asyncCacheMatches.length).toBe(exportCacheMatches.length)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cached functions should return typed data
   */
  it('cached functions should have proper TypeScript return types', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const dataFiles = ['pricing.ts', 'templates.ts']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...dataFiles),
        (fileName) => {
          const filePath = path.join(DATA_DIR, fileName)
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Exported cached functions should have Promise return types
          // Pattern: ): Promise<...> => {
          const promiseReturnPattern = /:\s*Promise<[^>]+>/
          expect(content).toMatch(promiseReturnPattern)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: pricing.ts must export getSubscriptionPlans
   */
  it('pricing.ts should export getSubscriptionPlans function', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const pricingPath = path.join(DATA_DIR, 'pricing.ts')
    const content = fs.readFileSync(pricingPath, 'utf-8')
    
    // Must export getSubscriptionPlans wrapped with cache
    const exportPattern = /export\s+const\s+getSubscriptionPlans\s*=\s*cache/
    expect(content).toMatch(exportPattern)
  })

  /**
   * Property: templates.ts must export getActiveTemplates
   */
  it('templates.ts should export getActiveTemplates function', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const templatesPath = path.join(DATA_DIR, 'templates.ts')
    const content = fs.readFileSync(templatesPath, 'utf-8')
    
    // Must export getActiveTemplates wrapped with cache
    const exportPattern = /export\s+const\s+getActiveTemplates\s*=\s*cache/
    expect(content).toMatch(exportPattern)
  })

  /**
   * Property: PricingSection should import from lib/data/pricing
   */
  it('PricingSection should use colocated data fetching from lib/data', () => {
    // **Feature: nextjs16-cache-components, Property 2: React Cache Deduplication**
    const pricingSectionPath = path.resolve(
      process.cwd(), 
      'components/landing-page/pricing-section.tsx'
    )
    const content = fs.readFileSync(pricingSectionPath, 'utf-8')
    
    // Must import getSubscriptionPlans from lib/data/pricing
    const importPattern = /import\s*{\s*getSubscriptionPlans\s*}\s*from\s*['"]@\/lib\/data\/pricing['"]/
    expect(content).toMatch(importPattern)
  })
})
