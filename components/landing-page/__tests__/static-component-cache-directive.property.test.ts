import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * **Feature: nextjs16-cache-components, Property 1: Static Component Cache Directive**
 * 
 * *For any* static landing page component (HeroSection, FeaturesSection, BenefitsSection, 
 * CTASection, Footer, Navigation), the component file SHALL contain the `use cache` directive 
 * at the top of the file.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
describe('Static Component Cache Directive', () => {
  const STATIC_LANDING_PAGE_COMPONENTS = [
    'hero-section',
    'features-section',
    'benefits-section',
    'cta-section',
    'footer',
    'navigation',
  ] as const

  const LANDING_PAGE_DIR = path.resolve(process.cwd(), 'components/landing-page')

  /**
   * Property: All static landing page components must have 'use cache' directive
   */
  it('all static landing page components should have use cache directive', () => {
    // **Feature: nextjs16-cache-components, Property 1: Static Component Cache Directive**
    fc.assert(
      fc.property(
        fc.constantFrom(...STATIC_LANDING_PAGE_COMPONENTS),
        (componentName) => {
          const componentPath = path.join(LANDING_PAGE_DIR, `${componentName}.tsx`)
          
          // Component file must exist
          expect(fs.existsSync(componentPath)).toBe(true)
          
          const content = fs.readFileSync(componentPath, 'utf-8')
          
          // The 'use cache' directive must be at the very beginning of the file
          // It can be either 'use cache' or "use cache"
          const useCachePattern = /^['"]use cache['"]/
          expect(content).toMatch(useCachePattern)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Components with 'use cache' must be async functions
   */
  it('cached components should be async functions', () => {
    // **Feature: nextjs16-cache-components, Property 1: Static Component Cache Directive**
    fc.assert(
      fc.property(
        fc.constantFrom(...STATIC_LANDING_PAGE_COMPONENTS),
        (componentName) => {
          const componentPath = path.join(LANDING_PAGE_DIR, `${componentName}.tsx`)
          const content = fs.readFileSync(componentPath, 'utf-8')
          
          // If component has 'use cache', it must have async function export
          if (content.match(/^['"]use cache['"]/)) {
            // Check for async function pattern in default export
            const asyncExportPattern = /export\s+default\s+async\s+function/
            expect(content).toMatch(asyncExportPattern)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cached components should not have 'use client' directive
   */
  it('cached components should not have use client directive', () => {
    // **Feature: nextjs16-cache-components, Property 1: Static Component Cache Directive**
    fc.assert(
      fc.property(
        fc.constantFrom(...STATIC_LANDING_PAGE_COMPONENTS),
        (componentName) => {
          const componentPath = path.join(LANDING_PAGE_DIR, `${componentName}.tsx`)
          const content = fs.readFileSync(componentPath, 'utf-8')
          
          // Components with 'use cache' cannot have 'use client'
          // These directives are mutually exclusive
          const useClientPattern = /['"]use client['"]/
          expect(content).not.toMatch(useClientPattern)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
