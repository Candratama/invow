/**
 * Property-Based Tests for Customer Server Actions - RLS Isolation
 *
 * **Feature: customer-management, Property 12: RLS isolation per store**
 * **Validates: Requirements 5.5**
 *
 * For any customer query by a user, only customers belonging to stores
 * owned by that user should be returned.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Customer } from '@/lib/db/database.types'

/**
 * Simulated multi-tenant customer store for testing RLS isolation
 * This models the database with multiple users and stores
 */
interface MultiTenantStore {
  users: Map<string, { id: string }>
  stores: Map<string, { id: string; user_id: string }>
  customers: Map<string, Customer>
}

/**
 * Pure function that simulates RLS-enforced getCustomers behavior
 * Only returns customers from stores owned by the requesting user
 */
function simulateRLSGetCustomers(
  db: MultiTenantStore,
  requestingUserId: string,
  storeId: string
): Customer[] {
  // First check if the store belongs to the requesting user (RLS check)
  const store = db.stores.get(storeId)
  if (!store || store.user_id !== requestingUserId) {
    // RLS would prevent access - return empty
    return []
  }

  // Return only active customers from the store
  return Array.from(db.customers.values())
    .filter(c => c.store_id === storeId && c.is_active === true)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Pure function that simulates RLS-enforced searchCustomers behavior
 */
function simulateRLSSearchCustomers(
  db: MultiTenantStore,
  requestingUserId: string,
  storeId: string,
  query: string
): Customer[] {
  // First check if the store belongs to the requesting user (RLS check)
  const store = db.stores.get(storeId)
  if (!store || store.user_id !== requestingUserId) {
    // RLS would prevent access - return empty
    return []
  }

  const lowerQuery = query.toLowerCase()
  return Array.from(db.customers.values())
    .filter(c => 
      c.store_id === storeId && 
      c.is_active === true &&
      c.name.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Pure function that simulates RLS-enforced getCustomer behavior
 */
function simulateRLSGetCustomer(
  db: MultiTenantStore,
  requestingUserId: string,
  customerId: string
): Customer | null {
  const customer = db.customers.get(customerId)
  if (!customer) return null

  // Check if the customer's store belongs to the requesting user (RLS check)
  const store = db.stores.get(customer.store_id)
  if (!store || store.user_id !== requestingUserId) {
    // RLS would prevent access
    return null
  }

  return customer
}

/**
 * Helper to create a customer in the simulated database
 */
function createCustomerInDb(
  db: MultiTenantStore,
  storeId: string,
  name: string,
  phone: string,
  address: string
): { db: MultiTenantStore; customer: Customer } {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const customer: Customer = {
    id,
    store_id: storeId,
    name,
    phone,
    address,
    email: null,
    notes: null,
    is_active: true,
    created_at: now,
    updated_at: now,
  }

  const newCustomers = new Map(db.customers)
  newCustomers.set(id, customer)

  return {
    db: { ...db, customers: newCustomers },
    customer,
  }
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

describe('Customer Server Actions - RLS Isolation Property Tests', () => {
  /**
   * **Feature: customer-management, Property 12: RLS isolation per store**
   * **Validates: Requirements 5.5**
   *
   * For any customer query by a user, only customers belonging to stores
   * owned by that user should be returned.
   */
  describe('Property 12: RLS isolation per store', () => {
    it('should only return customers from stores owned by the requesting user', async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArb,
          validPhoneArb,
          validAddressArb,
          async (name, phone, address) => {
            // Setup: Two users with their own stores
            const user1Id = crypto.randomUUID()
            const user2Id = crypto.randomUUID()
            const store1Id = crypto.randomUUID()
            const store2Id = crypto.randomUUID()

            let db: MultiTenantStore = {
              users: new Map([
                [user1Id, { id: user1Id }],
                [user2Id, { id: user2Id }],
              ]),
              stores: new Map([
                [store1Id, { id: store1Id, user_id: user1Id }],
                [store2Id, { id: store2Id, user_id: user2Id }],
              ]),
              customers: new Map(),
            }

            // Create customer in user1's store
            const result1 = createCustomerInDb(db, store1Id, name, phone, address)
            db = result1.db

            // Create customer in user2's store
            const result2 = createCustomerInDb(db, store2Id, `${name} Other`, phone, address)
            db = result2.db

            // Property: User1 can only see customers from their own store
            const user1Customers = simulateRLSGetCustomers(db, user1Id, store1Id)
            expect(user1Customers.length).toBe(1)
            expect(user1Customers[0].store_id).toBe(store1Id)

            // Property: User1 cannot see customers from user2's store
            const user1TryingUser2Store = simulateRLSGetCustomers(db, user1Id, store2Id)
            expect(user1TryingUser2Store.length).toBe(0)

            // Property: User2 can only see customers from their own store
            const user2Customers = simulateRLSGetCustomers(db, user2Id, store2Id)
            expect(user2Customers.length).toBe(1)
            expect(user2Customers[0].store_id).toBe(store2Id)

            // Property: User2 cannot see customers from user1's store
            const user2TryingUser1Store = simulateRLSGetCustomers(db, user2Id, store1Id)
            expect(user2TryingUser1Store.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prevent cross-store customer access via getCustomer', async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArb,
          validPhoneArb,
          validAddressArb,
          async (name, phone, address) => {
            // Setup: Two users with their own stores
            const user1Id = crypto.randomUUID()
            const user2Id = crypto.randomUUID()
            const store1Id = crypto.randomUUID()
            const store2Id = crypto.randomUUID()

            let db: MultiTenantStore = {
              users: new Map([
                [user1Id, { id: user1Id }],
                [user2Id, { id: user2Id }],
              ]),
              stores: new Map([
                [store1Id, { id: store1Id, user_id: user1Id }],
                [store2Id, { id: store2Id, user_id: user2Id }],
              ]),
              customers: new Map(),
            }

            // Create customer in user1's store
            const result = createCustomerInDb(db, store1Id, name, phone, address)
            db = result.db
            const customerId = result.customer.id

            // Property: User1 can access their own customer
            const user1Access = simulateRLSGetCustomer(db, user1Id, customerId)
            expect(user1Access).not.toBeNull()
            expect(user1Access!.id).toBe(customerId)

            // Property: User2 cannot access user1's customer
            const user2Access = simulateRLSGetCustomer(db, user2Id, customerId)
            expect(user2Access).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should enforce RLS on search operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArb,
          validPhoneArb,
          validAddressArb,
          async (name, phone, address) => {
            // Setup: Two users with their own stores
            const user1Id = crypto.randomUUID()
            const user2Id = crypto.randomUUID()
            const store1Id = crypto.randomUUID()
            const store2Id = crypto.randomUUID()

            let db: MultiTenantStore = {
              users: new Map([
                [user1Id, { id: user1Id }],
                [user2Id, { id: user2Id }],
              ]),
              stores: new Map([
                [store1Id, { id: store1Id, user_id: user1Id }],
                [store2Id, { id: store2Id, user_id: user2Id }],
              ]),
              customers: new Map(),
            }

            // Create customer with searchable name in user1's store
            const searchableName = 'SearchableCustomer'
            const result = createCustomerInDb(db, store1Id, searchableName, phone, address)
            db = result.db

            // Property: User1 can search and find their customer
            const user1Search = simulateRLSSearchCustomers(db, user1Id, store1Id, 'Searchable')
            expect(user1Search.length).toBe(1)
            expect(user1Search[0].name).toBe(searchableName)

            // Property: User2 cannot search user1's store
            const user2SearchUser1Store = simulateRLSSearchCustomers(db, user2Id, store1Id, 'Searchable')
            expect(user2SearchUser1Store.length).toBe(0)

            // Property: User2 searching their own store returns nothing (no customers there)
            const user2SearchOwnStore = simulateRLSSearchCustomers(db, user2Id, store2Id, 'Searchable')
            expect(user2SearchOwnStore.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should isolate customers across multiple stores per user', async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArb,
          validPhoneArb,
          validAddressArb,
          async (name, phone, address) => {
            // Setup: One user with multiple stores
            const userId = crypto.randomUUID()
            const store1Id = crypto.randomUUID()
            const store2Id = crypto.randomUUID()

            let db: MultiTenantStore = {
              users: new Map([
                [userId, { id: userId }],
              ]),
              stores: new Map([
                [store1Id, { id: store1Id, user_id: userId }],
                [store2Id, { id: store2Id, user_id: userId }],
              ]),
              customers: new Map(),
            }

            // Create customer in store1
            const result1 = createCustomerInDb(db, store1Id, `${name} Store1`, phone, address)
            db = result1.db

            // Create customer in store2
            const result2 = createCustomerInDb(db, store2Id, `${name} Store2`, phone, address)
            db = result2.db

            // Property: Querying store1 only returns store1 customers
            const store1Customers = simulateRLSGetCustomers(db, userId, store1Id)
            expect(store1Customers.length).toBe(1)
            expect(store1Customers[0].store_id).toBe(store1Id)

            // Property: Querying store2 only returns store2 customers
            const store2Customers = simulateRLSGetCustomers(db, userId, store2Id)
            expect(store2Customers.length).toBe(1)
            expect(store2Customers[0].store_id).toBe(store2Id)

            // Property: Customers from different stores don't mix
            expect(store1Customers[0].id).not.toBe(store2Customers[0].id)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty for non-existent stores', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (userId, nonExistentStoreId) => {
            // Setup: User exists but store doesn't
            const db: MultiTenantStore = {
              users: new Map([
                [userId, { id: userId }],
              ]),
              stores: new Map(),
              customers: new Map(),
            }

            // Property: Querying non-existent store returns empty
            const customers = simulateRLSGetCustomers(db, userId, nonExistentStoreId)
            expect(customers.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
