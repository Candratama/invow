/**
 * Property-Based Tests for Invoice Filters
 *
 * **Feature: admin-panel-phase2, Property 1: Invoice user filter correctness**
 * **Feature: admin-panel-phase2, Property 2: Invoice store filter correctness**
 * **Feature: admin-panel-phase2, Property 3: Invoice status filter correctness**
 * **Feature: admin-panel-phase2, Property 4: Invoice date range filter correctness**
 * **Feature: admin-panel-phase2, Property 5: Invoice amount range filter correctness**
 * **Feature: admin-panel-phase2, Property 6: Invoice search filter correctness**
 * **Feature: admin-panel-phase2, Property 25: Pagination bounds**
 * **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  applyInvoiceFilters,
  applyPagination,
  type InvoiceFilters,
} from '../admin-invoices.service'

// Generators
const statusArb = fc.constantFrom('draft', 'pending', 'synced') as fc.Arbitrary<'draft' | 'pending' | 'synced'>

// Generate timestamps within a reasonable range (last year)
const timestampArb = fc.integer({ 
  min: Date.now() - 365 * 24 * 60 * 60 * 1000, 
  max: Date.now() 
}).map(ts => new Date(ts).toISOString())

// Generate date strings for date range testing
const dateStringArb = fc.integer({ 
  min: Date.now() - 365 * 24 * 60 * 60 * 1000, 
  max: Date.now() 
}).map(ts => new Date(ts).toISOString().split('T')[0])

// Generate invoice list item
const invoiceListItemArb = fc.record({
  id: fc.uuid(),
  invoiceNumber: fc.stringMatching(/^INV-[0-9]{4,8}$/),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  userEmail: fc.emailAddress(),
  userId: fc.uuid(),
  storeName: fc.string({ minLength: 1, maxLength: 50 }),
  storeId: fc.uuid(),
  total: fc.integer({ min: 0, max: 100000000 }),
  status: statusArb,
  invoiceDate: dateStringArb,
  createdAt: timestampArb,
})

const invoicesListArb = fc.array(invoiceListItemArb, { minLength: 0, maxLength: 50 })

describe('Property 1: Invoice user filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 1: Invoice user filter correctness**
   * **Validates: Requirements 1.3**
   */
  it('should return only invoices belonging to the selected user when userId filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.uuid(),
        async (invoices, userId) => {
          const filters: InvoiceFilters = { userId }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have user_id matching the filter value
          for (const invoice of filtered) {
            expect(invoice.userId).toBe(userId)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all invoices when userId filter is not specified', async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const filters: InvoiceFilters = {}
        const filtered = applyInvoiceFilters(invoices, filters)
        
        expect(filtered.length).toBe(invoices.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of invoices with matching userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.uuid(),
        async (invoices, userId) => {
          const filters: InvoiceFilters = { userId }
          const filtered = applyInvoiceFilters(invoices, filters)
          const expectedCount = invoices.filter(inv => inv.userId === userId).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 2: Invoice store filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 2: Invoice store filter correctness**
   * **Validates: Requirements 1.4**
   */
  it('should return only invoices belonging to the selected store when storeId filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.uuid(),
        async (invoices, storeId) => {
          const filters: InvoiceFilters = { storeId }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have store_id matching the filter value
          for (const invoice of filtered) {
            expect(invoice.storeId).toBe(storeId)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of invoices with matching storeId', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.uuid(),
        async (invoices, storeId) => {
          const filters: InvoiceFilters = { storeId }
          const filtered = applyInvoiceFilters(invoices, filters)
          const expectedCount = invoices.filter(inv => inv.storeId === storeId).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})


describe('Property 3: Invoice status filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 3: Invoice status filter correctness**
   * **Validates: Requirements 1.5**
   */
  it('should return only invoices matching the selected status when filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.constantFrom('draft', 'pending', 'synced') as fc.Arbitrary<'draft' | 'pending' | 'synced'>,
        async (invoices, status) => {
          const filters: InvoiceFilters = { status }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have status matching the filter value
          for (const invoice of filtered) {
            expect(invoice.status).toBe(status)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all invoices when status filter is "all"', async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const filters: InvoiceFilters = { status: 'all' }
        const filtered = applyInvoiceFilters(invoices, filters)
        
        expect(filtered.length).toBe(invoices.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of invoices with matching status', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.constantFrom('draft', 'pending', 'synced') as fc.Arbitrary<'draft' | 'pending' | 'synced'>,
        async (invoices, status) => {
          const filters: InvoiceFilters = { status }
          const filtered = applyInvoiceFilters(invoices, filters)
          const expectedCount = invoices.filter(inv => inv.status === status).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 4: Invoice date range filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 4: Invoice date range filter correctness**
   * **Validates: Requirements 1.6**
   */
  it('should return only invoices with invoice_date within the specified range (inclusive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        dateStringArb,
        dateStringArb,
        async (invoices, date1, date2) => {
          // Ensure dateFrom <= dateTo
          const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1]
          const filters: InvoiceFilters = { dateFrom, dateTo }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have invoice_date within range
          for (const invoice of filtered) {
            const invoiceDate = new Date(invoice.invoiceDate)
            const from = new Date(dateFrom)
            from.setHours(0, 0, 0, 0)
            const to = new Date(dateTo)
            to.setHours(23, 59, 59, 999)
            
            expect(invoiceDate >= from).toBe(true)
            expect(invoiceDate <= to).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all invoices when no date range is specified', async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const filters: InvoiceFilters = {}
        const filtered = applyInvoiceFilters(invoices, filters)
        
        expect(filtered.length).toBe(invoices.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only dateFrom specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        dateStringArb,
        async (invoices, dateFrom) => {
          const filters: InvoiceFilters = { dateFrom }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have invoice_date >= dateFrom
          for (const invoice of filtered) {
            const invoiceDate = new Date(invoice.invoiceDate)
            const from = new Date(dateFrom)
            from.setHours(0, 0, 0, 0)
            
            expect(invoiceDate >= from).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only dateTo specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        dateStringArb,
        async (invoices, dateTo) => {
          const filters: InvoiceFilters = { dateTo }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have invoice_date <= dateTo
          for (const invoice of filtered) {
            const invoiceDate = new Date(invoice.invoiceDate)
            const to = new Date(dateTo)
            to.setHours(23, 59, 59, 999)
            
            expect(invoiceDate <= to).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


describe('Property 5: Invoice amount range filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 5: Invoice amount range filter correctness**
   * **Validates: Requirements 1.7**
   */
  it('should return only invoices with total >= amountMin and total <= amountMax', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 0, max: 50000000 }),
        fc.integer({ min: 0, max: 50000000 }),
        async (invoices, amount1, amount2) => {
          // Ensure amountMin <= amountMax
          const [amountMin, amountMax] = amount1 <= amount2 ? [amount1, amount2] : [amount2, amount1]
          const filters: InvoiceFilters = { amountMin, amountMax }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have total within range
          for (const invoice of filtered) {
            expect(invoice.total >= amountMin).toBe(true)
            expect(invoice.total <= amountMax).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only amountMin specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 0, max: 50000000 }),
        async (invoices, amountMin) => {
          const filters: InvoiceFilters = { amountMin }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have total >= amountMin
          for (const invoice of filtered) {
            expect(invoice.total >= amountMin).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only amountMax specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 0, max: 100000000 }),
        async (invoices, amountMax) => {
          const filters: InvoiceFilters = { amountMax }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices have total <= amountMax
          for (const invoice of filtered) {
            expect(invoice.total <= amountMax).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of invoices within amount range', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 0, max: 50000000 }),
        fc.integer({ min: 0, max: 50000000 }),
        async (invoices, amount1, amount2) => {
          const [amountMin, amountMax] = amount1 <= amount2 ? [amount1, amount2] : [amount2, amount1]
          const filters: InvoiceFilters = { amountMin, amountMax }
          const filtered = applyInvoiceFilters(invoices, filters)
          const expectedCount = invoices.filter(
            inv => inv.total >= amountMin && inv.total <= amountMax
          ).length
          
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 6: Invoice search filter correctness', () => {
  /**
   * **Feature: admin-panel-phase2, Property 6: Invoice search filter correctness**
   * **Validates: Requirements 1.8**
   */
  it('should return only invoices with invoice_number or customer_name containing the search term (case-insensitive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        async (invoices, search) => {
          const filters: InvoiceFilters = { search }
          const filtered = applyInvoiceFilters(invoices, filters)
          
          // Property: All returned invoices contain search term in invoice_number or customer_name
          const searchLower = search.toLowerCase()
          for (const invoice of filtered) {
            const matchesInvoiceNumber = invoice.invoiceNumber.toLowerCase().includes(searchLower)
            const matchesCustomerName = invoice.customerName.toLowerCase().includes(searchLower)
            expect(matchesInvoiceNumber || matchesCustomerName).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all invoices when search is empty', async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const filters: InvoiceFilters = { search: '' }
        const filtered = applyInvoiceFilters(invoices, filters)
        
        // Empty search should not filter anything
        expect(filtered.length).toBe(invoices.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should be case-insensitive when searching', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.string({ minLength: 1, maxLength: 5 }),
        async (invoices, search) => {
          const filtersLower: InvoiceFilters = { search: search.toLowerCase() }
          const filtersUpper: InvoiceFilters = { search: search.toUpperCase() }
          
          const filteredLower = applyInvoiceFilters(invoices, filtersLower)
          const filteredUpper = applyInvoiceFilters(invoices, filtersUpper)
          
          // Property: Case should not affect results
          expect(filteredLower.length).toBe(filteredUpper.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 25: Pagination bounds', () => {
  /**
   * **Feature: admin-panel-phase2, Property 25: Pagination bounds**
   * **Validates: Requirements 1.1, 1.9, 4.1, 4.7**
   */
  it('should return correct number of items based on page and pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        async (invoices, page, pageSize) => {
          const { items, total } = applyPagination(invoices, page, pageSize)
          
          // Property: Total equals original array length
          expect(total).toBe(invoices.length)
          
          // Property: Returned items count is min(pageSize, total - offset)
          const offset = (page - 1) * pageSize
          const expectedCount = Math.max(0, Math.min(pageSize, invoices.length - offset))
          expect(items.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return items within the correct offset range', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb.filter(arr => arr.length > 0),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (invoices, page, pageSize) => {
          const { items } = applyPagination(invoices, page, pageSize)
          const offset = (page - 1) * pageSize
          
          // Property: Items are from the correct slice of the original array
          const expectedItems = invoices.slice(offset, offset + pageSize)
          expect(items).toEqual(expectedItems)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return empty array when page is beyond available data', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 1, max: 10 }),
        async (invoices, pageSize) => {
          // Calculate a page that's definitely beyond the data
          const totalPages = Math.ceil(invoices.length / pageSize)
          const beyondPage = totalPages + 5
          
          const { items, total } = applyPagination(invoices, beyondPage, pageSize)
          
          // Property: Items should be empty when page is beyond data
          expect(items.length).toBe(0)
          expect(total).toBe(invoices.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle page 1 correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        fc.integer({ min: 1, max: 20 }),
        async (invoices, pageSize) => {
          const { items } = applyPagination(invoices, 1, pageSize)
          
          // Property: Page 1 returns first pageSize items
          const expectedItems = invoices.slice(0, pageSize)
          expect(items).toEqual(expectedItems)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use default values when page and pageSize are not provided', async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const { items, total } = applyPagination(invoices)
        
        // Property: Default page=1, pageSize=10
        const expectedItems = invoices.slice(0, 10)
        expect(items).toEqual(expectedItems)
        expect(total).toBe(invoices.length)
      }),
      { numRuns: 100 }
    )
  })
})
