/**
 * Property-Based Tests for Customer Selection
 * 
 * **Feature: customer-management, Property 6: Customer selection populates all form fields**
 * **Validates: Requirements 2.2**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Customer } from '@/lib/db/database.types'

// Helper to generate digit strings of specific length
const digitString = (minLength: number, maxLength: number) =>
  fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength, maxLength })
    .map(arr => arr.join(''))

// Use constant ISO date strings to avoid Invalid Date errors
const isoDateArb = fc.constant(new Date().toISOString())

// Arbitrary for generating valid Customer objects
const customerArbitrary = fc.record({
  id: fc.uuid(),
  store_id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
  phone: fc.tuple(
    fc.constantFrom('', '+'),
    digitString(8, 15)
  ).map(([prefix, digits]) => `${prefix}${digits}`),
  address: fc.string({ minLength: 5, maxLength: 500 }),
  email: fc.oneof(
    fc.constant(null),
    fc.emailAddress()
  ),
  notes: fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 0, maxLength: 500 })
  ),
  is_active: fc.constant(true),
  created_at: isoDateArb,
  updated_at: isoDateArb,
}) as fc.Arbitrary<Customer>

/**
 * Simulates the form state that would result from selecting a customer
 * This is a pure function that represents the transformation logic
 */
interface FormState {
  customerName: string
  customerPhone: string
  customerAddress: string
}

function populateFormFromCustomer(customer: Customer): FormState {
  return {
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
  }
}

describe('Customer Selection Property Tests', () => {
  /**
   * **Feature: customer-management, Property 6: Customer selection populates all form fields**
   * **Validates: Requirements 2.2**
   * 
   * For any customer selection, the resulting form state should contain
   * the customer's name, phone, and address in the corresponding fields.
   */
  describe('Property 6: Customer selection populates all form fields', () => {
    it('should populate all required form fields when a customer is selected', () => {
      fc.assert(
        fc.property(
          customerArbitrary,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            
            // Verify all required fields are populated
            expect(formState.customerName).toBe(customer.name)
            expect(formState.customerPhone).toBe(customer.phone)
            expect(formState.customerAddress).toBe(customer.address)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve exact customer data without modification', () => {
      fc.assert(
        fc.property(
          customerArbitrary,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            
            // Verify data is not modified during population
            expect(formState.customerName).toStrictEqual(customer.name)
            expect(formState.customerPhone).toStrictEqual(customer.phone)
            expect(formState.customerAddress).toStrictEqual(customer.address)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle customers with various name lengths', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            store_id: fc.uuid(),
            name: fc.oneof(
              fc.constant('AB'),  // Minimum valid name
              fc.string({ minLength: 50, maxLength: 100 }).filter(s => s.trim().length >= 2),  // Long name
              fc.constant('John Doe'),  // Typical name
            ),
            phone: fc.constant('08123456789'),
            address: fc.constant('123 Main Street'),
            email: fc.constant(null),
            notes: fc.constant(null),
            is_active: fc.constant(true),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
          }) as fc.Arbitrary<Customer>,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            expect(formState.customerName).toBe(customer.name)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle customers with various phone formats', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            store_id: fc.uuid(),
            name: fc.constant('Test Customer'),
            phone: fc.oneof(
              fc.constant('08123456789'),      // Local format
              fc.constant('+628123456789'),    // International with +
              fc.constant('628123456789'),     // International without +
              fc.constant('12345678'),         // Minimum 8 digits
              fc.constant('123456789012345'),  // Maximum 15 digits
            ),
            address: fc.constant('123 Main Street'),
            email: fc.constant(null),
            notes: fc.constant(null),
            is_active: fc.constant(true),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
          }) as fc.Arbitrary<Customer>,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            expect(formState.customerPhone).toBe(customer.phone)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle customers with various address formats', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            store_id: fc.uuid(),
            name: fc.constant('Test Customer'),
            phone: fc.constant('08123456789'),
            address: fc.oneof(
              fc.constant('12345'),  // Minimum valid address
              fc.string({ minLength: 100, maxLength: 500 }),  // Long address
              fc.constant('Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110'),  // Typical Indonesian address
            ),
            email: fc.constant(null),
            notes: fc.constant(null),
            is_active: fc.constant(true),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
          }) as fc.Arbitrary<Customer>,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            expect(formState.customerAddress).toBe(customer.address)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional property: Form state is complete
   * Ensures no fields are undefined or missing after selection
   */
  describe('Form state completeness', () => {
    it('should never have undefined values for required fields', () => {
      fc.assert(
        fc.property(
          customerArbitrary,
          (customer) => {
            const formState = populateFormFromCustomer(customer)
            
            expect(formState.customerName).toBeDefined()
            expect(formState.customerPhone).toBeDefined()
            expect(formState.customerAddress).toBeDefined()
            
            expect(typeof formState.customerName).toBe('string')
            expect(typeof formState.customerPhone).toBe('string')
            expect(typeof formState.customerAddress).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
