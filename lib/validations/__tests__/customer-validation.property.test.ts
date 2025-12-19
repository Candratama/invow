/**
 * Property-Based Tests for Customer Validation
 * 
 * **Feature: customer-management, Property 2: Name validation rejects invalid names**
 * **Feature: customer-management, Property 3: Phone validation enforces Indonesian format**
 * **Feature: customer-management, Property 4: Address validation rejects short addresses**
 * **Validates: Requirements 1.3, 1.4, 6.1, 6.2, 6.3**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  customerSchema, 
  validateCustomerName, 
  validateCustomerPhone, 
  validateCustomerAddress 
} from '../customer'

// Helper to generate digit strings of specific length
const digitString = (minLength: number, maxLength: number) =>
  fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength, maxLength })
    .map(arr => arr.join(''))

describe('Customer Validation Property Tests', () => {
  /**
   * **Feature: customer-management, Property 2: Name validation rejects invalid names**
   * **Validates: Requirements 1.3, 6.1**
   * 
   * For any string that is empty or contains fewer than 2 characters (before trim),
   * the customer validation should reject it and return a name validation error.
   * Note: The schema validates length BEFORE the trim transform.
   */
  describe('Property 2: Name validation rejects invalid names', () => {
    it('should reject names with fewer than 2 characters', () => {
      fc.assert(
        fc.property(
          // Generate strings with 0 or 1 character (raw length, not trimmed)
          fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 0, maxLength: 1 })
          ),
          (invalidName) => {
            const error = validateCustomerName(invalidName)
            expect(error).toBeDefined()
            expect(error).toContain('2 characters')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept names with 2 or more characters', () => {
      fc.assert(
        fc.property(
          // Generate valid names (2+ characters)
          fc.string({ minLength: 2, maxLength: 100 })
            .filter(s => s.trim().length >= 2),
          (validName) => {
            const error = validateCustomerName(validName)
            expect(error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-management, Property 3: Phone validation enforces Indonesian format**
   * **Validates: Requirements 1.4, 6.2**
   * 
   * For any string that does not match the pattern ^\+?[0-9]{8,15}$,
   * the customer validation should reject it and return a phone validation error.
   * For any string matching the pattern, validation should pass.
   */
  describe('Property 3: Phone validation enforces Indonesian format', () => {
    it('should reject phone numbers not matching Indonesian format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Too short (less than 8 digits)
            digitString(1, 7),
            // Too long (more than 15 digits)
            digitString(16, 20),
            // Contains non-digit characters (except leading +)
            fc.tuple(
              digitString(3, 5),
              fc.constantFrom('a', 'b', '-', ' ', '.', '(', ')'),
              digitString(3, 5)
            ).map(([pre, char, post]) => `${pre}${char}${post}`),
            // Empty string
            fc.constant(''),
            // Only whitespace
            fc.constant('   '),
            // + in wrong position
            fc.tuple(
              digitString(4, 6),
              fc.constant('+'),
              digitString(4, 6)
            ).map(([pre, plus, post]) => `${pre}${plus}${post}`)
          ),
          (invalidPhone) => {
            const error = validateCustomerPhone(invalidPhone)
            expect(error).toBeDefined()
            expect(error).toContain('Invalid phone number format')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept valid Indonesian phone numbers', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            // Optional + prefix
            fc.constantFrom('', '+'),
            // 8-15 digits
            digitString(8, 15)
          ).map(([prefix, digits]) => `${prefix}${digits}`),
          (validPhone) => {
            const error = validateCustomerPhone(validPhone)
            expect(error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept common Indonesian phone formats', () => {
      // Test specific common formats
      // Note: The regex allows 8-15 digits total (not counting the optional + prefix)
      const validFormats = [
        '08123456789',      // Local format (11 digits)
        '+628123456789',    // International format (12 digits + prefix)
        '628123456789',     // Without + prefix (12 digits)
        '081234567890',     // 11 digits
        '123456789012345'   // Max 15 digits
      ]
      
      validFormats.forEach(phone => {
        const error = validateCustomerPhone(phone)
        expect(error).toBeUndefined()
      })
    })
  })

  /**
   * **Feature: customer-management, Property 4: Address validation rejects short addresses**
   * **Validates: Requirements 6.3**
   * 
   * For any string containing fewer than 5 characters,
   * the customer validation should reject it and return an address validation error.
   */
  describe('Property 4: Address validation rejects short addresses', () => {
    it('should reject addresses with fewer than 5 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 4 }),
          (shortAddress) => {
            const error = validateCustomerAddress(shortAddress)
            expect(error).toBeDefined()
            expect(error).toContain('5 characters')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept addresses with 5 or more characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 500 }),
          (validAddress) => {
            const error = validateCustomerAddress(validAddress)
            expect(error).toBeUndefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Combined schema validation test
   * Tests the full customerSchema with valid data
   */
  describe('Full customer schema validation', () => {
    // Generate valid email addresses that pass Zod's strict validation
    const validEmailArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
      fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.org')
    ).map(([local, domain]) => `${local}@${domain}`)

    it('should accept valid customer data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
            phone: fc.tuple(
              fc.constantFrom('', '+'),
              digitString(8, 15)
            ).map(([prefix, digits]) => `${prefix}${digits}`),
            address: fc.string({ minLength: 5, maxLength: 500 }),
            email: fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.constant(''),
              validEmailArb
            ),
            notes: fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.string({ minLength: 0, maxLength: 500 })
            )
          }),
          (customerData) => {
            const result = customerSchema.safeParse(customerData)
            expect(result.success).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject customer data with any invalid field', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid name
            fc.record({
              name: fc.string({ minLength: 0, maxLength: 1 }),
              phone: fc.constant('08123456789'),
              address: fc.constant('Valid Address')
            }),
            // Invalid phone
            fc.record({
              name: fc.constant('Valid Name'),
              phone: fc.string({ minLength: 1, maxLength: 5 }),
              address: fc.constant('Valid Address')
            }),
            // Invalid address
            fc.record({
              name: fc.constant('Valid Name'),
              phone: fc.constant('08123456789'),
              address: fc.string({ minLength: 0, maxLength: 4 })
            })
          ),
          (invalidData) => {
            const result = customerSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
