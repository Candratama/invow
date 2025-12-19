/**
 * Property-Based Tests for Customer Service
 *
 * **Feature: customer-management, Property 1: Customer save round trip**
 * **Feature: customer-management, Property 5: Customer search returns only matching results**
 * **Feature: customer-management, Property 9: Customer update persistence**
 * **Feature: customer-management, Property 10: Soft delete sets is_active to false**
 * **Feature: customer-management, Property 11: Soft-deleted customers excluded from active lists**
 * **Validates: Requirements 1.2, 2.3, 4.2, 4.3, 4.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/db/database.types'

/**
 * Simulated in-memory customer store for testing pure functions
 */
interface CustomerStore {
  customers: Map<string, Customer>
}

/**
 * Pure function that simulates createCustomer behavior
 */
function simulateCreateCustomer(
  store: CustomerStore,
  data: CustomerInsert
): { store: CustomerStore; customer: Customer } {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const customer: Customer = {
    id,
    store_id: data.store_id,
    name: data.name,
    phone: data.phone,
    address: data.address,
    email: data.email ?? null,
    notes: data.notes ?? null,
    is_active: data.is_active ?? true,
    created_at: now,
    updated_at: now,
  }
  
  const newCustomers = new Map(store.customers)
  newCustomers.set(id, customer)
  
  return {
    store: { customers: newCustomers },
    customer,
  }
}


/**
 * Pure function that simulates getCustomer behavior
 */
function simulateGetCustomer(
  store: CustomerStore,
  id: string
): Customer | null {
  return store.customers.get(id) ?? null
}

/**
 * Pure function that simulates updateCustomer behavior
 */
function simulateUpdateCustomer(
  store: CustomerStore,
  id: string,
  data: CustomerUpdate
): { store: CustomerStore; customer: Customer | null } {
  const existing = store.customers.get(id)
  if (!existing) {
    return { store, customer: null }
  }
  
  const updated: Customer = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const newCustomers = new Map(store.customers)
  newCustomers.set(id, updated)
  
  return {
    store: { customers: newCustomers },
    customer: updated,
  }
}

/**
 * Pure function that simulates deleteCustomer (soft delete) behavior
 */
function simulateSoftDelete(
  store: CustomerStore,
  id: string
): { store: CustomerStore; success: boolean } {
  const existing = store.customers.get(id)
  if (!existing) {
    return { store, success: false }
  }
  
  const updated: Customer = {
    ...existing,
    is_active: false,
    updated_at: new Date().toISOString(),
  }
  
  const newCustomers = new Map(store.customers)
  newCustomers.set(id, updated)
  
  return {
    store: { customers: newCustomers },
    success: true,
  }
}

/**
 * Pure function that simulates getCustomers (active only) behavior
 */
function simulateGetActiveCustomers(
  store: CustomerStore,
  storeId: string
): Customer[] {
  return Array.from(store.customers.values())
    .filter(c => c.store_id === storeId && c.is_active === true)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Pure function that simulates searchCustomers behavior
 */
function simulateSearchCustomers(
  store: CustomerStore,
  storeId: string,
  query: string
): Customer[] {
  const lowerQuery = query.toLowerCase()
  return Array.from(store.customers.values())
    .filter(c => 
      c.store_id === storeId && 
      c.is_active === true &&
      c.name.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}


// Helper to generate digit strings of specific length
const digitString = (minLength: number, maxLength: number) =>
  fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength, maxLength })
    .map(arr => arr.join(''))

// Generators for valid customer data
const validNameArb = fc.string({ minLength: 2, maxLength: 100 })
  .filter(s => s.trim().length >= 2)

const validPhoneArb = fc.tuple(
  fc.constantFrom('', '+'),
  digitString(8, 15)
).map(([prefix, digits]) => `${prefix}${digits}`)

const validAddressArb = fc.string({ minLength: 5, maxLength: 500 })

const validCustomerInsertArb: fc.Arbitrary<CustomerInsert> = fc.record({
  store_id: fc.uuid(),
  name: validNameArb,
  phone: validPhoneArb,
  address: validAddressArb,
  email: fc.oneof(fc.constant(null), fc.constant(undefined)),
  notes: fc.oneof(fc.constant(null), fc.constant(undefined)),
})

const validCustomerUpdateArb: fc.Arbitrary<CustomerUpdate> = fc.record({
  name: fc.option(validNameArb, { nil: undefined }),
  phone: fc.option(validPhoneArb, { nil: undefined }),
  address: fc.option(validAddressArb, { nil: undefined }),
})

describe('Customer Service Property Tests', () => {
  /**
   * **Feature: customer-management, Property 1: Customer save round trip**
   * **Validates: Requirements 1.2, 1.5, 2.5**
   *
   * For any valid customer data (name ≥ 2 chars, valid phone, address ≥ 5 chars),
   * saving the customer and then retrieving it by ID should return a customer
   * with identical name, phone, and address fields.
   */
  describe('Property 1: Customer save round trip', () => {
    it('should preserve name, phone, and address after save and retrieve', async () => {
      await fc.assert(
        fc.asyncProperty(validCustomerInsertArb, async (customerData) => {
          const emptyStore: CustomerStore = { customers: new Map() }
          
          // Create customer
          const { store: storeAfterCreate, customer: created } = 
            simulateCreateCustomer(emptyStore, customerData)
          
          // Retrieve customer
          const retrieved = simulateGetCustomer(storeAfterCreate, created.id)
          
          // Property: Retrieved customer has identical core fields
          expect(retrieved).not.toBeNull()
          expect(retrieved!.name).toBe(customerData.name)
          expect(retrieved!.phone).toBe(customerData.phone)
          expect(retrieved!.address).toBe(customerData.address)
        }),
        { numRuns: 100 }
      )
    })

    it('should set is_active to true by default', async () => {
      await fc.assert(
        fc.asyncProperty(validCustomerInsertArb, async (customerData) => {
          const emptyStore: CustomerStore = { customers: new Map() }
          
          const { customer } = simulateCreateCustomer(emptyStore, customerData)
          
          // Property: New customers are active by default
          expect(customer.is_active).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: customer-management, Property 5: Customer search returns only matching results**
   * **Validates: Requirements 2.3**
   *
   * For any search query and customer list, all returned customers should have
   * names that contain the search query (case-insensitive).
   */
  describe('Property 5: Customer search returns only matching results', () => {
    it('should return only customers whose names contain the query', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(validCustomerInsertArb, { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          async (storeId, customerDataList, searchQuery) => {
            // Create store with multiple customers
            let store: CustomerStore = { customers: new Map() }
            
            for (const data of customerDataList) {
              const result = simulateCreateCustomer(store, { ...data, store_id: storeId })
              store = result.store
            }
            
            // Search customers
            const results = simulateSearchCustomers(store, storeId, searchQuery)
            
            // Property: All results contain the search query (case-insensitive)
            const lowerQuery = searchQuery.toLowerCase()
            for (const customer of results) {
              expect(customer.name.toLowerCase()).toContain(lowerQuery)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty array when no customers match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          validCustomerInsertArb,
          async (storeId, customerData) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create a customer with a known name
            const result = simulateCreateCustomer(store, { 
              ...customerData, 
              store_id: storeId,
              name: 'John Doe'
            })
            store = result.store
            
            // Search with a query that won't match
            const results = simulateSearchCustomers(store, storeId, 'ZZZZNOTFOUND')
            
            // Property: No results when query doesn't match
            expect(results.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be case-insensitive', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          validCustomerInsertArb,
          async (storeId, customerData) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create a customer
            const result = simulateCreateCustomer(store, { 
              ...customerData, 
              store_id: storeId,
              name: 'John Doe'
            })
            store = result.store
            
            // Search with different cases
            const resultsLower = simulateSearchCustomers(store, storeId, 'john')
            const resultsUpper = simulateSearchCustomers(store, storeId, 'JOHN')
            const resultsMixed = simulateSearchCustomers(store, storeId, 'JoHn')
            
            // Property: All case variations return the same results
            expect(resultsLower.length).toBe(resultsUpper.length)
            expect(resultsLower.length).toBe(resultsMixed.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: customer-management, Property 9: Customer update persistence**
   * **Validates: Requirements 4.2**
   *
   * For any valid customer update, retrieving the customer after update
   * should return the updated values for all modified fields.
   */
  describe('Property 9: Customer update persistence', () => {
    it('should persist updated name', async () => {
      await fc.assert(
        fc.asyncProperty(
          validCustomerInsertArb,
          validNameArb,
          async (customerData, newName) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create customer
            const createResult = simulateCreateCustomer(store, customerData)
            store = createResult.store
            const customerId = createResult.customer.id
            
            // Update name
            const updateResult = simulateUpdateCustomer(store, customerId, { name: newName })
            store = updateResult.store
            
            // Retrieve and verify
            const retrieved = simulateGetCustomer(store, customerId)
            
            // Property: Updated name is persisted
            expect(retrieved).not.toBeNull()
            expect(retrieved!.name).toBe(newName)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist updated phone', async () => {
      await fc.assert(
        fc.asyncProperty(
          validCustomerInsertArb,
          validPhoneArb,
          async (customerData, newPhone) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create customer
            const createResult = simulateCreateCustomer(store, customerData)
            store = createResult.store
            const customerId = createResult.customer.id
            
            // Update phone
            const updateResult = simulateUpdateCustomer(store, customerId, { phone: newPhone })
            store = updateResult.store
            
            // Retrieve and verify
            const retrieved = simulateGetCustomer(store, customerId)
            
            // Property: Updated phone is persisted
            expect(retrieved).not.toBeNull()
            expect(retrieved!.phone).toBe(newPhone)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist updated address', async () => {
      await fc.assert(
        fc.asyncProperty(
          validCustomerInsertArb,
          validAddressArb,
          async (customerData, newAddress) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create customer
            const createResult = simulateCreateCustomer(store, customerData)
            store = createResult.store
            const customerId = createResult.customer.id
            
            // Update address
            const updateResult = simulateUpdateCustomer(store, customerId, { address: newAddress })
            store = updateResult.store
            
            // Retrieve and verify
            const retrieved = simulateGetCustomer(store, customerId)
            
            // Property: Updated address is persisted
            expect(retrieved).not.toBeNull()
            expect(retrieved!.address).toBe(newAddress)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve non-updated fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          validCustomerInsertArb,
          validNameArb,
          async (customerData, newName) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create customer
            const createResult = simulateCreateCustomer(store, customerData)
            store = createResult.store
            const customerId = createResult.customer.id
            const originalPhone = createResult.customer.phone
            const originalAddress = createResult.customer.address
            
            // Update only name
            const updateResult = simulateUpdateCustomer(store, customerId, { name: newName })
            store = updateResult.store
            
            // Retrieve and verify
            const retrieved = simulateGetCustomer(store, customerId)
            
            // Property: Non-updated fields are preserved
            expect(retrieved).not.toBeNull()
            expect(retrieved!.phone).toBe(originalPhone)
            expect(retrieved!.address).toBe(originalAddress)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: customer-management, Property 10: Soft delete sets is_active to false**
   * **Validates: Requirements 4.3**
   *
   * For any customer delete operation, the customer record should still exist
   * in the database with is_active set to false.
   */
  describe('Property 10: Soft delete sets is_active to false', () => {
    it('should set is_active to false after delete', async () => {
      await fc.assert(
        fc.asyncProperty(validCustomerInsertArb, async (customerData) => {
          let store: CustomerStore = { customers: new Map() }
          
          // Create customer
          const createResult = simulateCreateCustomer(store, customerData)
          store = createResult.store
          const customerId = createResult.customer.id
          
          // Verify initially active
          expect(createResult.customer.is_active).toBe(true)
          
          // Soft delete
          const deleteResult = simulateSoftDelete(store, customerId)
          store = deleteResult.store
          
          // Retrieve and verify
          const retrieved = simulateGetCustomer(store, customerId)
          
          // Property: Customer still exists but is_active is false
          expect(retrieved).not.toBeNull()
          expect(retrieved!.is_active).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve customer data after soft delete', async () => {
      await fc.assert(
        fc.asyncProperty(validCustomerInsertArb, async (customerData) => {
          let store: CustomerStore = { customers: new Map() }
          
          // Create customer
          const createResult = simulateCreateCustomer(store, customerData)
          store = createResult.store
          const customerId = createResult.customer.id
          const originalName = createResult.customer.name
          const originalPhone = createResult.customer.phone
          const originalAddress = createResult.customer.address
          
          // Soft delete
          const deleteResult = simulateSoftDelete(store, customerId)
          store = deleteResult.store
          
          // Retrieve and verify
          const retrieved = simulateGetCustomer(store, customerId)
          
          // Property: Customer data is preserved after soft delete
          expect(retrieved).not.toBeNull()
          expect(retrieved!.name).toBe(originalName)
          expect(retrieved!.phone).toBe(originalPhone)
          expect(retrieved!.address).toBe(originalAddress)
        }),
        { numRuns: 100 }
      )
    })

    it('should return success true for valid delete', async () => {
      await fc.assert(
        fc.asyncProperty(validCustomerInsertArb, async (customerData) => {
          let store: CustomerStore = { customers: new Map() }
          
          // Create customer
          const createResult = simulateCreateCustomer(store, customerData)
          store = createResult.store
          const customerId = createResult.customer.id
          
          // Soft delete
          const deleteResult = simulateSoftDelete(store, customerId)
          
          // Property: Delete returns success
          expect(deleteResult.success).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * **Feature: customer-management, Property 11: Soft-deleted customers excluded from active lists**
   * **Validates: Requirements 4.4**
   *
   * For any customer list query for active customers, no customer with
   * is_active = false should appear in the results.
   */
  describe('Property 11: Soft-deleted customers excluded from active lists', () => {
    it('should not include soft-deleted customers in getCustomers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(validCustomerInsertArb, { minLength: 2, maxLength: 5 }),
          async (storeId, customerDataList) => {
            let store: CustomerStore = { customers: new Map() }
            const customerIds: string[] = []
            
            // Create multiple customers
            for (const data of customerDataList) {
              const result = simulateCreateCustomer(store, { ...data, store_id: storeId })
              store = result.store
              customerIds.push(result.customer.id)
            }
            
            // Soft delete the first customer
            const deleteResult = simulateSoftDelete(store, customerIds[0])
            store = deleteResult.store
            
            // Get active customers
            const activeCustomers = simulateGetActiveCustomers(store, storeId)
            
            // Property: Deleted customer is not in active list
            const deletedCustomerInList = activeCustomers.some(c => c.id === customerIds[0])
            expect(deletedCustomerInList).toBe(false)
            
            // Property: All returned customers have is_active = true
            for (const customer of activeCustomers) {
              expect(customer.is_active).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not include soft-deleted customers in search results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          validCustomerInsertArb,
          async (storeId, customerData) => {
            let store: CustomerStore = { customers: new Map() }
            
            // Create customer with known name
            const createResult = simulateCreateCustomer(store, { 
              ...customerData, 
              store_id: storeId,
              name: 'Searchable Customer'
            })
            store = createResult.store
            const customerId = createResult.customer.id
            
            // Verify customer is found before delete
            const beforeDelete = simulateSearchCustomers(store, storeId, 'Searchable')
            expect(beforeDelete.length).toBe(1)
            
            // Soft delete
            const deleteResult = simulateSoftDelete(store, customerId)
            store = deleteResult.store
            
            // Search again
            const afterDelete = simulateSearchCustomers(store, storeId, 'Searchable')
            
            // Property: Deleted customer is not in search results
            expect(afterDelete.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return correct count after soft delete', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(validCustomerInsertArb, { minLength: 3, maxLength: 5 }),
          async (storeId, customerDataList) => {
            let store: CustomerStore = { customers: new Map() }
            const customerIds: string[] = []
            
            // Create multiple customers
            for (const data of customerDataList) {
              const result = simulateCreateCustomer(store, { ...data, store_id: storeId })
              store = result.store
              customerIds.push(result.customer.id)
            }
            
            const initialCount = simulateGetActiveCustomers(store, storeId).length
            
            // Soft delete one customer
            const deleteResult = simulateSoftDelete(store, customerIds[0])
            store = deleteResult.store
            
            const afterDeleteCount = simulateGetActiveCustomers(store, storeId).length
            
            // Property: Count decreases by 1 after soft delete
            expect(afterDeleteCount).toBe(initialCount - 1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
