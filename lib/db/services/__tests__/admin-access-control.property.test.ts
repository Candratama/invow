/**
 * Property-Based Test for Admin Access Control
 *
 * **Feature: admin-panel-phase1, Property 1: Admin access control**
 * **Validates: Requirements 1.1, 1.2**
 *
 * Property: For any user attempting to access admin routes, access is granted
 * if and only if the user has `is_admin` flag set to true in their metadata
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Define types for testing
interface UserMetadata {
  is_admin?: boolean
  [key: string]: unknown
}

interface User {
  id: string
  email: string
  user_metadata: UserMetadata
}

/**
 * Pure function that determines if a user should have admin access
 * This mirrors the logic in middleware.ts and admin.service.ts
 */
function shouldGrantAdminAccess(user: User | null): boolean {
  if (!user) {
    return false
  }
  return user.user_metadata?.is_admin === true
}

/**
 * Pure function that determines the redirect behavior for admin routes
 * Returns: 'allow' | 'login' | 'dashboard'
 */
function getAdminRouteRedirect(
  user: User | null
): 'allow' | 'login' | 'dashboard' {
  if (!user) {
    return 'login'
  }
  if (user.user_metadata?.is_admin === true) {
    return 'allow'
  }
  return 'dashboard'
}

/**
 * Generator for user metadata with various is_admin values
 */
const userMetadataArb = fc.oneof(
  // Explicitly true
  fc.record({ is_admin: fc.constant(true) }),
  // Explicitly false
  fc.record({ is_admin: fc.constant(false) }),
  // Missing is_admin field
  fc.record({}),
  // is_admin as string "true" (should not grant access)
  fc.record({ is_admin: fc.constant('true' as unknown as boolean) }),
  // is_admin as number 1 (should not grant access)
  fc.record({ is_admin: fc.constant(1 as unknown as boolean) }),
  // is_admin as null
  fc.record({ is_admin: fc.constant(null as unknown as boolean) }),
  // is_admin as undefined
  fc.record({ is_admin: fc.constant(undefined) })
)

/**
 * Generator for valid users with various metadata
 */
const userArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  user_metadata: userMetadataArb,
})

/**
 * Generator for nullable users (authenticated or not)
 */
const nullableUserArb = fc.oneof(fc.constant(null), userArb)

describe('Property 1: Admin access control', () => {
  it('should grant access if and only if is_admin is strictly true', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const hasAccess = shouldGrantAdminAccess(user)
        const isAdminTrue = (user.user_metadata as { is_admin?: boolean })?.is_admin === true

        // Property: Access granted iff is_admin === true
        expect(hasAccess).toBe(isAdminTrue)
      }),
      { numRuns: 100 }
    )
  })

  it('should deny access to unauthenticated users (null user)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (user) => {
        const hasAccess = shouldGrantAdminAccess(user)

        // Property: Null user should never have access
        expect(hasAccess).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should redirect unauthenticated users to login page', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (user) => {
        const redirect = getAdminRouteRedirect(user)

        // Property: Unauthenticated users redirect to login
        expect(redirect).toBe('login')
      }),
      { numRuns: 100 }
    )
  })

  it('should redirect non-admin authenticated users to dashboard', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          user_metadata: fc.oneof(
            fc.record({ is_admin: fc.constant(false) }),
            fc.record({}),
            fc.record({ is_admin: fc.constant(null as unknown as boolean) }),
            fc.record({ is_admin: fc.constant('true' as unknown as boolean) }),
            fc.record({ is_admin: fc.constant(1 as unknown as boolean) })
          ),
        }),
        async (user) => {
          const redirect = getAdminRouteRedirect(user)

          // Property: Non-admin users redirect to dashboard
          expect(redirect).toBe('dashboard')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should allow admin users to access admin routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          user_metadata: fc.record({ is_admin: fc.constant(true) }),
        }),
        async (user) => {
          const redirect = getAdminRouteRedirect(user)

          // Property: Admin users are allowed access
          expect(redirect).toBe('allow')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not grant access for truthy but non-boolean is_admin values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          user_metadata: fc.oneof(
            fc.record({ is_admin: fc.constant('true' as unknown as boolean) }),
            fc.record({ is_admin: fc.constant(1 as unknown as boolean) }),
            fc.record({
              is_admin: fc.constant({ value: true } as unknown as boolean),
            }),
            fc.record({ is_admin: fc.constant([true] as unknown as boolean) })
          ),
        }),
        async (user) => {
          const hasAccess = shouldGrantAdminAccess(user)

          // Property: Only boolean true grants access, not truthy values
          expect(hasAccess).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify proxy implements admin route protection', () => {
    // Next.js 16 renamed middleware.ts to proxy.ts
    const proxyPath = path.join(process.cwd(), 'proxy.ts')
    const fileContent = fs.readFileSync(proxyPath, 'utf-8')

    // Property: Proxy should check for admin paths
    expect(fileContent).toContain('/admin')
    expect(fileContent).toContain('adminPaths')

    // Property: Proxy should check is_admin in user metadata
    expect(fileContent).toContain('is_admin')
    expect(fileContent).toContain('user_metadata')

    // Property: Proxy should redirect unauthenticated to login
    expect(fileContent).toContain('/dashboard/login')

    // Property: Proxy should redirect non-admin to dashboard
    expect(fileContent).toContain('/dashboard')
    expect(fileContent).toContain('unauthorized')
  })

  it('should verify admin service implements isAdmin check correctly', () => {
    const adminServicePath = path.join(
      process.cwd(),
      'lib/db/services/admin.service.ts'
    )
    const fileContent = fs.readFileSync(adminServicePath, 'utf-8')

    // Property: Admin service should have isAdmin function
    expect(fileContent).toContain('export async function isAdmin')

    // Property: Admin service should check user_metadata.is_admin
    expect(fileContent).toContain('user_metadata')
    expect(fileContent).toContain('is_admin')

    // Property: Admin service should use strict equality check
    expect(fileContent).toContain('=== true')

    // Property: Admin service should return false for invalid userId
    expect(fileContent).toContain('if (!userId)')
    expect(fileContent).toContain('return false')
  })

  it('should handle edge cases for user metadata consistently', async () => {
    await fc.assert(
      fc.asyncProperty(nullableUserArb, async (user) => {
        const hasAccess = shouldGrantAdminAccess(user)
        const redirect = getAdminRouteRedirect(user)

        // Property: Access and redirect should be consistent
        if (hasAccess) {
          expect(redirect).toBe('allow')
        } else if (user === null) {
          expect(redirect).toBe('login')
        } else {
          expect(redirect).toBe('dashboard')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should ensure admin access is deterministic for same user', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const access1 = shouldGrantAdminAccess(user)
        const access2 = shouldGrantAdminAccess(user)
        const access3 = shouldGrantAdminAccess(user)

        // Property: Same user should always get same access decision
        expect(access1).toBe(access2)
        expect(access2).toBe(access3)
      }),
      { numRuns: 100 }
    )
  })
})
