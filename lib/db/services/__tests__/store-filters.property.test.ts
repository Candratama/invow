/**
 * Property-Based Tests for Store Filters
 *
 * **Feature: admin-panel-phase2, Property 10: Store user filter correctness**
 * **Feature: admin-panel-phase2, Property 11: Store active filter correctness**
 * **Feature: admin-panel-phase2, Property 12: Store search filter correctness**
 * **Validates: Requirements 4.3, 4.4, 4.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  applyStoreFilters,
  applyPagination,
  type StoreFilters,
  type StoreListItem,
} from '../admin-stores.service'

// Generators
const timestampArb = fc.integer({ 
  min: Date.now() - 365 * 24 * 60 * 60 * 1000, 
  max: Date.now() 
}).map(ts => new Date(ts).toISOString())

// Generate store list item
const storeListItemArb: fc.Arbitrary<StoreListItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  storeCode: fc.stringMatching(/^[A-Z]{2,4}-[0-9]{3,6}$/),
  userEmail: fc.emailAddress(),
  userId: fc.uuid(),
  isActive: fc.boolean(),
  invoiceCount: fc.integer({ min: 0, max: 1000 }),
  createdAt: timestampArb,
})

const storesListArb = fc.array(storeListItemArb, { minLength: 0, maxLength: 50 })

describe('Property 10: Store user filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 10: Store user filter correctness**
   * **Validates: Requirements 4.3**
   */
  it('should return only stores belonging to the selected user when userId filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.uuid(),
        async (stores, userId) => {
          const filters: StoreFilters = { userId }
          const filtered = applyStoreFilters(stores, filters)
          
          // Property: All returned stores have user_id matching the filter value
          for (const store of filtered) {
            expect(store.userId).toBe(userId)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all stores when userId filter is not specified', async () => {
    await fc.assert(
      fc.asyncProperty(storesListArb, async (stores) => {
        const filters: StoreFilters = {}
        const filtered = applyStoreFilters(stores, filters)
        
        expect(filtered.length).toBe(stores.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of stores with matching userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.uuid(),
        async (stores, userId) => {
          const filters: StoreFilters = { userId }
          const filtered = applyStoreFilters(stores, filters)
          const expectedCount = stores.filter(s => s.userId === userId).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 11: Store active filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 11: Store active filter correctness**
   * **Validates: Requirements 4.4**
   */
  it('should return only active stores when isActive filter is true', async () => {
    await fc.assert(
      fc.asyncProperty(storesListArb, async (stores) => {
        const filters: StoreFilters = { isActive: true }
        const filtered = applyStoreFilters(stores, filters)
        
        // Property: All returned stores have is_active = true
        for (const store of filtered) {
          expect(store.isActive).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should return only inactive stores when isActive filter is false', async () => {
    await fc.assert(
      fc.asyncProperty(storesListArb, async (stores) => {
        const filters: StoreFilters = { isActive: false }
        const filtered = applyStoreFilters(stores, filters)
        
        // Property: All returned stores have is_active = false
        for (const store of filtered) {
          expect(store.isActive).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should return all stores when isActive filter is "all"', async () => {
    await fc.assert(
      fc.asyncProperty(storesListArb, async (stores) => {
        const filters: StoreFilters = { isActive: 'all' }
        const filtered = applyStoreFilters(stores, filters)
        
        expect(filtered.length).toBe(stores.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of stores with matching isActive status', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.boolean(),
        async (stores, isActive) => {
          const filters: StoreFilters = { isActive }
          const filtered = applyStoreFilters(stores, filters)
          const expectedCount = stores.filter(s => s.isActive === isActive).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 12: Store search filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 12: Store search filter correctness**
   * **Validates: Requirements 4.5**
   */
  it('should return only stores with name or store_code containing the search term (case-insensitive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        async (stores, search) => {
          const filters: StoreFilters = { search }
          const filtered = applyStoreFilters(stores, filters)
          
          // Property: All returned stores contain search term in name or store_code
          const searchLower = search.toLowerCase()
          for (const store of filtered) {
            const matchesName = store.name.toLowerCase().includes(searchLower)
            const matchesStoreCode = store.storeCode.toLowerCase().includes(searchLower)
            expect(matchesName || matchesStoreCode).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all stores when search is empty', async () => {
    await fc.assert(
      fc.asyncProperty(storesListArb, async (stores) => {
        const filters: StoreFilters = { search: '' }
        const filtered = applyStoreFilters(stores, filters)
        
        // Empty search should not filter anything
        expect(filtered.length).toBe(stores.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should be case-insensitive when searching', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.string({ minLength: 1, maxLength: 5 }),
        async (stores, search) => {
          const filtersLower: StoreFilters = { search: search.toLowerCase() }
          const filtersUpper: StoreFilters = { search: search.toUpperCase() }
          
          const filteredLower = applyStoreFilters(stores, filtersLower)
          const filteredUpper = applyStoreFilters(stores, filtersUpper)
          
          // Property: Case should not affect results
          expect(filteredLower.length).toBe(filteredUpper.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of stores matching search term', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.string({ minLength: 1, maxLength: 5 }),
        async (stores, search) => {
          const filters: StoreFilters = { search }
          const filtered = applyStoreFilters(stores, filters)
          const searchLower = search.toLowerCase()
          const expectedCount = stores.filter(
            s => s.name.toLowerCase().includes(searchLower) || 
                 s.storeCode.toLowerCase().includes(searchLower)
          ).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Store pagination (reuses Property 25)', () => {
  /**
   * Pagination tests for stores - reuses Property 25 logic
   * **Validates: Requirements 4.1, 4.7**
   */
  it('should return correct number of items based on page and pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        async (stores, page, pageSize) => {
          const { items, total } = applyPagination(stores, page, pageSize)
          
          // Property: Total equals original array length
          expect(total).toBe(stores.length)
          
          // Property: Returned items count is min(pageSize, total - offset)
          const offset = (page - 1) * pageSize
          const expectedCount = Math.max(0, Math.min(pageSize, stores.length - offset))
          expect(items.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return items within the correct offset range', async () => {
    await fc.assert(
      fc.asyncProperty(
        storesListArb.filter(arr => arr.length > 0),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (stores, page, pageSize) => {
          const { items } = applyPagination(stores, page, pageSize)
          const offset = (page - 1) * pageSize
          
          // Property: Items are from the correct slice of the original array
          const expectedItems = stores.slice(offset, offset + pageSize)
          expect(items).toEqual(expectedItems)
        }
      ),
      { numRuns: 100 }
    )
  })
})
