/**
 * Property-Based Test for Customer Data Persistence Across Subscription Changes
 *
 * **Feature: premium-customer-management, Property 5: Customer data persistence across subscription changes**
 * **Validates: Requirements 5.1, 5.2**
 *
 * Property: For any user with existing customers, changing subscription status
 * (premium to free or free to premium) should not delete or modify any customer
 * records in the database.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

describe('Property 5: Customer data persistence across subscription changes', () => {
  const customersFilePath = path.join(process.cwd(), 'app/actions/customers.ts')
  const fileContent = fs.readFileSync(customersFilePath, 'utf-8')

  /**
   * Property: hasExistingCustomersAction should NOT call validatePremiumAccess
   * This ensures free users can check if they have existing customers
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction does not require premium access', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the hasExistingCustomersAction function definition
          const functionRegex = /export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          expect(match!.length).toBeGreaterThan(0)
          
          const functionBody = match![0]
          
          // Property: hasExistingCustomersAction should NOT call validatePremiumAccess
          // This is critical for data preservation - free users need to know if they have data
          expect(functionBody).not.toContain('validatePremiumAccess')
          
          // Property: Should NOT check premiumCheck.hasAccess
          expect(functionBody).not.toContain('premiumCheck')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: hasExistingCustomersAction should still require authentication
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction requires authentication but not premium', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the hasExistingCustomersAction function definition
          const functionRegex = /export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          const functionBody = match![0]
          
          // Property: Should still require authentication
          expect(functionBody).toContain('getUser')
          expect(functionBody).toContain('Unauthorized')
          
          // Property: Should verify store ownership
          expect(functionBody).toContain('user_id')
          expect(functionBody).toContain('Store not found or access denied')
          
          // Property: Should NOT require premium access
          expect(functionBody).not.toContain('validatePremiumAccess')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: hasExistingCustomersAction should check ALL customers (including inactive)
   * This ensures data preservation message shows even for soft-deleted customers
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction checks all customers including inactive', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the hasExistingCustomersAction function definition
          const functionRegex = /export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          const functionBody = match![0]
          
          // Property: Should query customers table
          expect(functionBody).toContain("from('customers')")
          
          // Property: Should use count query
          expect(functionBody).toContain('count')
          
          // Property: Should filter by store_id
          expect(functionBody).toContain('store_id')
          
          // Property: Should NOT filter by is_active (to include inactive customers)
          // This ensures we count ALL customers for data preservation
          expect(functionBody).not.toContain("is_active")
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: hasExistingCustomersAction should return boolean result
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction returns proper boolean result', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the hasExistingCustomersAction function definition
          const functionRegex = /export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          const functionBody = match![0]
          
          // Property: Should return success: true with data
          expect(functionBody).toContain('success: true')
          expect(functionBody).toContain('data:')
          
          // Property: Should return boolean based on count
          expect(functionBody).toContain('count')
          expect(functionBody).toContain('> 0')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Customer data operations should not delete data on subscription change
   * This verifies that no customer action performs hard deletes
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify customer actions use soft delete pattern for data preservation', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the deleteCustomerAction function definition
          const functionRegex = /export async function deleteCustomerAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          const functionBody = match![0]
          
          // Property: Should use CustomersService for deletion
          expect(functionBody).toContain('CustomersService')
          expect(functionBody).toContain('deleteCustomer')
          
          // Property: Should NOT contain direct DELETE SQL
          // This ensures soft delete pattern is used
          expect(functionBody).not.toContain('.delete()')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: hasExistingCustomersAction should be accessible regardless of tier
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction is tier-agnostic', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium'),
        (tier) => {
          // Find the hasExistingCustomersAction function definition
          const functionRegex = /export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionRegex)
          
          expect(match).not.toBeNull()
          const functionBody = match![0]
          
          // Property: Should NOT check tier at all
          expect(functionBody).not.toContain("tier")
          expect(functionBody).not.toContain("'free'")
          expect(functionBody).not.toContain("'premium'")
          
          // Property: Should NOT use SubscriptionService
          expect(functionBody).not.toContain('SubscriptionService')
          expect(functionBody).not.toContain('getSubscriptionStatus')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Comment documentation should indicate intentional no premium check
   * Validates: Requirements 5.1, 5.2
   */
  it('should verify hasExistingCustomersAction has documentation about no premium check', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          // Find the hasExistingCustomersAction function and its JSDoc
          const functionWithDocRegex = /\/\*\*[\s\S]*?\*\/\s*export async function hasExistingCustomersAction[\s\S]*?(?=export async function|$)/g
          const match = fileContent.match(functionWithDocRegex)
          
          expect(match).not.toBeNull()
          const functionWithDoc = match![0]
          
          // Property: Should have documentation explaining it works for both free and premium
          expect(functionWithDoc).toContain('free')
          expect(functionWithDoc).toContain('premium')
          
          // Property: Should mention data preservation
          expect(functionWithDoc).toContain('preservation')
        }
      ),
      { numRuns: 100 }
    )
  })
})
