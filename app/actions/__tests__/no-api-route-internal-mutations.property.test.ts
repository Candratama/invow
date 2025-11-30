/**
 * Property-Based Test for No API Route Usage for Internal Mutations
 * 
 * **Feature: refactor-api-to-server-actions, Property 3: No API route usage for internal mutations**
 * **Feature: refactor-api-to-server-actions, Property 6: Redundant API routes are removed**
 * **Validates: Requirements 1.1, 2.1, 2.2, 2.3**
 * 
 * Property 3: For any client component that performs mutations (create, update, delete), 
 * it must call Server Actions directly, not fetch() to API routes (except for external webhooks).
 * 
 * Property 6: For any API route that duplicates functionality available in data-access layer 
 * or Server Actions, the route file must not exist and no code must reference it.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

describe('Property 3: No API route usage for internal mutations', () => {
  it('should verify client components use Server Actions instead of fetch() for mutations', () => {
    // List of client component files that perform mutations
    const clientComponentsWithMutations = [
      'components/features/subscription/upgrade-button.tsx',
      'components/features/settings/business-info-tab.tsx',
      'components/features/settings/invoice-settings-tab.tsx',
      'components/features/invoice/invoice-form.tsx',
    ]

    fc.assert(
      fc.property(
        fc.constantFrom(...clientComponentsWithMutations),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath)
          
          // Skip if file doesn't exist
          if (!fs.existsSync(fullPath)) {
            return true
          }

          const fileContent = fs.readFileSync(fullPath, 'utf-8')

          // Property: Client components should NOT use fetch() to internal API routes for mutations
          // Internal API routes are those under /api/ that are not webhooks
          const internalApiPatterns = [
            /fetch\s*\(\s*['"`]\/api\/subscriptions/,
            /fetch\s*\(\s*['"`]\/api\/preferences/,
            /fetch\s*\(\s*['"`]\/api\/store/,
            /fetch\s*\(\s*['"`]\/api\/invoices/,
          ]

          for (const pattern of internalApiPatterns) {
            const hasInternalApiFetch = pattern.test(fileContent)
            expect(hasInternalApiFetch).toBe(false)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify mutation components import Server Actions', () => {
    const componentActionPairs = [
      {
        component: 'components/features/subscription/upgrade-button.tsx',
        expectedImports: ['createPaymentInvoiceAction'],
      },
      {
        component: 'components/features/settings/business-info-tab.tsx',
        expectedImports: ['updateStoreAction'],
      },
    ]

    fc.assert(
      fc.property(
        fc.constantFrom(...componentActionPairs),
        ({ component, expectedImports }) => {
          const fullPath = path.join(process.cwd(), component)
          
          // Skip if file doesn't exist
          if (!fs.existsSync(fullPath)) {
            return true
          }

          const fileContent = fs.readFileSync(fullPath, 'utf-8')

          // Property: Components that perform mutations should import Server Actions
          for (const actionImport of expectedImports) {
            const hasActionImport = fileContent.includes(actionImport)
            expect(hasActionImport).toBe(true)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 6: Redundant API routes are removed', () => {
  it('should verify redundant API routes do not exist', () => {
    // List of API routes that should have been removed (redundant with Server Actions or data-access)
    const redundantApiRoutes = [
      'app/api/subscriptions/current/route.ts',
    ]

    fc.assert(
      fc.property(
        fc.constantFrom(...redundantApiRoutes),
        (routePath) => {
          const fullPath = path.join(process.cwd(), routePath)
          
          // Property: Redundant API routes should NOT exist
          const routeExists = fs.existsSync(fullPath)
          expect(routeExists).toBe(false)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify no code references removed API routes', () => {
    // Directories to search for references
    const searchDirs = [
      'components',
      'app/dashboard',
      'lib',
    ]

    // Removed API routes that should not be referenced
    const removedRoutes = [
      '/api/subscriptions/current',
    ]

    fc.assert(
      fc.property(
        fc.constantFrom(...searchDirs),
        (searchDir) => {
          const dirPath = path.join(process.cwd(), searchDir)
          
          if (!fs.existsSync(dirPath)) {
            return true
          }

          // Recursively get all .ts and .tsx files
          const getAllFiles = (dir: string): string[] => {
            const files: string[] = []
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name)
              if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                files.push(...getAllFiles(fullPath))
              } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
                files.push(fullPath)
              }
            }
            return files
          }

          const files = getAllFiles(dirPath)

          for (const file of files) {
            // Skip test files
            if (file.includes('.test.') || file.includes('__tests__')) {
              continue
            }

            const content = fs.readFileSync(file, 'utf-8')
            
            for (const route of removedRoutes) {
              const hasReference = content.includes(route)
              expect(hasReference).toBe(false)
            }
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify only webhook and external API routes remain', () => {
    // API routes that should still exist (webhooks and external integrations)
    const allowedApiRoutes = [
      'app/api/payments/webhook',
      'app/api/payments/verify/route.ts',
      'app/api/payments/create-invoice/route.ts', // May be deprecated but kept for backward compatibility
      'app/api/payments/lookup/route.ts',
      'app/api/payments/clear-cache/route.ts',
      'app/api/payments/debug-mayar/route.ts',
      'app/api/auth/callback/route.ts',
    ]

    const apiDir = path.join(process.cwd(), 'app/api')
    
    if (!fs.existsSync(apiDir)) {
      return
    }

    // Get all route.ts files in api directory
    const getAllRouteFiles = (dir: string): string[] => {
      const files: string[] = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...getAllRouteFiles(fullPath))
        } else if (entry.name === 'route.ts') {
          files.push(fullPath)
        }
      }
      return files
    }

    const routeFiles = getAllRouteFiles(apiDir)
    const relativePaths = routeFiles.map(f => path.relative(process.cwd(), f))

    fc.assert(
      fc.property(
        fc.constantFrom(...relativePaths),
        (routePath) => {
          // Property: All remaining API routes should be in the allowed list
          // or be related to webhooks/external integrations
          const isAllowed = allowedApiRoutes.some(allowed => 
            routePath.includes(allowed.replace('/route.ts', '')) || 
            routePath === allowed
          )
          
          // Routes related to payments (webhooks, verification) are allowed
          const isPaymentRelated = routePath.includes('app/api/payments')
          
          // Auth callback is allowed
          const isAuthCallback = routePath.includes('app/api/auth') || routePath.includes('app/auth')

          expect(isAllowed || isPaymentRelated || isAuthCallback).toBe(true)

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
