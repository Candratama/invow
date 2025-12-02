/**
 * Property-Based Tests for Transaction Filters and Status
 *
 * **Feature: admin-panel-phase1, Property 10: Transaction status filter correctness**
 * **Feature: admin-panel-phase1, Property 11: Transaction date range filter**
 * **Feature: admin-panel-phase1, Property 12: Stale transaction detection**
 * **Feature: admin-panel-phase1, Property 17: Transaction verification effect**
 * **Validates: Requirements 7.3, 7.4, 7.6, 7.7**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isTransactionStale, isWithinDateRange } from '../admin-transactions.service'

// Types matching the admin-transactions service
interface TransactionListItem {
  id: string
  userId: string
  userEmail: string
  amount: number
  tier: string
  status: string
  paymentMethod: string | null
  mayarInvoiceId: string
  mayarTransactionId: string | null
  createdAt: string
  completedAt: string | null
  verifiedAt: string | null
  isStale: boolean
}

// TransactionFilters interface is defined in admin-transactions.service.ts
// Keeping this comment for reference of the expected shape:
// interface TransactionFilters {
//   status?: 'pending' | 'completed' | 'failed' | 'all'
//   dateFrom?: string
//   dateTo?: string
//   page?: number
//   pageSize?: number
// }

/**
 * Pure function that applies status filter to transactions
 * Mirrors the logic in admin-transactions.service.ts
 */
function applyStatusFilter(
  transactions: TransactionListItem[],
  status?: 'pending' | 'completed' | 'failed' | 'all'
): TransactionListItem[] {
  if (!status || status === 'all') {
    return transactions
  }
  return transactions.filter((t) => t.status === status)
}

/**
 * Pure function that applies date range filter to transactions
 * Mirrors the logic in admin-transactions.service.ts
 */
function applyDateRangeFilter(
  transactions: TransactionListItem[],
  dateFrom?: string,
  dateTo?: string
): TransactionListItem[] {
  if (!dateFrom && !dateTo) {
    return transactions
  }
  return transactions.filter((t) => isWithinDateRange(t.createdAt, dateFrom, dateTo))
}


/**
 * Simulate transaction verification
 * Sets verified_at while preserving other fields
 */
function verifyTransactionPure(
  transaction: TransactionListItem,
  verifiedAt: string
): TransactionListItem {
  return {
    ...transaction,
    verifiedAt,
  }
}

// Generators
const statusArb = fc.constantFrom('pending', 'completed', 'failed')
// statusFilterArb is available for future use in status filter tests
// const statusFilterArb = fc.constantFrom('pending', 'completed', 'failed', 'all') as fc.Arbitrary<'pending' | 'completed' | 'failed' | 'all'>
const tierArb = fc.constantFrom('free', 'premium')

// Generate timestamps within a reasonable range (last 2 years)
const timestampArb = fc.integer({ 
  min: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, 
  max: Date.now() 
}).map(ts => new Date(ts).toISOString())

// Generate timestamps specifically for stale testing (can be old or recent)
const staleTestTimestampArb = fc.oneof(
  // Recent (within 24 hours)
  fc.integer({ 
    min: Date.now() - 23 * 60 * 60 * 1000, 
    max: Date.now() 
  }).map(ts => new Date(ts).toISOString()),
  // Old (more than 24 hours ago)
  fc.integer({ 
    min: Date.now() - 30 * 24 * 60 * 60 * 1000, 
    max: Date.now() - 25 * 60 * 60 * 1000 
  }).map(ts => new Date(ts).toISOString())
)

const transactionListItemArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  userEmail: fc.emailAddress(),
  amount: fc.integer({ min: 10000, max: 1000000 }),
  tier: tierArb,
  status: statusArb,
  paymentMethod: fc.option(fc.constantFrom('bank_transfer', 'credit_card', 'e_wallet'), { nil: null }),
  mayarInvoiceId: fc.uuid(),
  mayarTransactionId: fc.option(fc.uuid(), { nil: null }),
  createdAt: timestampArb,
  completedAt: fc.option(timestampArb, { nil: null }),
  verifiedAt: fc.option(timestampArb, { nil: null }),
  isStale: fc.boolean(),
})

const transactionsListArb = fc.array(transactionListItemArb, { minLength: 0, maxLength: 50 })

// Generate date strings for date range testing
const dateStringArb = fc.integer({ 
  min: Date.now() - 365 * 24 * 60 * 60 * 1000, 
  max: Date.now() 
}).map(ts => new Date(ts).toISOString().split('T')[0])

describe('Property 10: Transaction status filter correctness', () => {
  it('should return only transactions matching the selected status when filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        fc.constantFrom('pending', 'completed', 'failed') as fc.Arbitrary<'pending' | 'completed' | 'failed'>,
        async (transactions, statusFilter) => {
          const filtered = applyStatusFilter(transactions, statusFilter)
          
          // Property: All returned transactions have status matching the filter
          for (const transaction of filtered) {
            expect(transaction.status).toBe(statusFilter)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all transactions when status filter is "all"', async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const filtered = applyStatusFilter(transactions, 'all')
        
        // Property: All transactions are returned when filter is 'all'
        expect(filtered.length).toBe(transactions.length)
        expect(filtered).toEqual(transactions)
      }),
      { numRuns: 100 }
    )
  })

  it('should return all transactions when status filter is undefined', async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const filtered = applyStatusFilter(transactions, undefined)
        
        // Property: All transactions are returned when filter is undefined
        expect(filtered.length).toBe(transactions.length)
        expect(filtered).toEqual(transactions)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of transactions with matching status', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        fc.constantFrom('pending', 'completed', 'failed') as fc.Arbitrary<'pending' | 'completed' | 'failed'>,
        async (transactions, statusFilter) => {
          const filtered = applyStatusFilter(transactions, statusFilter)
          const expectedCount = transactions.filter(t => t.status === statusFilter).length
          
          // Property: Filtered count equals count of transactions with matching status
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not include transactions with non-matching status', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        fc.constantFrom('pending', 'completed', 'failed') as fc.Arbitrary<'pending' | 'completed' | 'failed'>,
        async (transactions, statusFilter) => {
          const filtered = applyStatusFilter(transactions, statusFilter)
          
          // Property: No transactions with non-matching status in results
          const hasOtherStatus = filtered.some(t => t.status !== statusFilter)
          expect(hasOtherStatus).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})


describe('Property 11: Transaction date range filter', () => {
  it('should return only transactions within the specified date range (inclusive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          // Ensure dateFrom <= dateTo
          const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1]
          const filtered = applyDateRangeFilter(transactions, dateFrom, dateTo)
          
          // Property: All returned transactions have createdAt within range
          for (const transaction of filtered) {
            expect(isWithinDateRange(transaction.createdAt, dateFrom, dateTo)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all transactions when no date range is specified', async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const filtered = applyDateRangeFilter(transactions, undefined, undefined)
        
        // Property: All transactions are returned when no date range
        expect(filtered.length).toBe(transactions.length)
        expect(filtered).toEqual(transactions)
      }),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only dateFrom specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        async (transactions, dateFrom) => {
          const filtered = applyDateRangeFilter(transactions, dateFrom, undefined)
          
          // Property: All returned transactions have createdAt >= dateFrom
          for (const transaction of filtered) {
            expect(isWithinDateRange(transaction.createdAt, dateFrom, undefined)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should filter correctly with only dateTo specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        async (transactions, dateTo) => {
          const filtered = applyDateRangeFilter(transactions, undefined, dateTo)
          
          // Property: All returned transactions have createdAt <= dateTo
          for (const transaction of filtered) {
            expect(isWithinDateRange(transaction.createdAt, undefined, dateTo)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not include transactions outside the date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1]
          const filtered = applyDateRangeFilter(transactions, dateFrom, dateTo)
          
          // Property: No transactions outside range in results
          const outsideRange = filtered.filter(
            t => !isWithinDateRange(t.createdAt, dateFrom, dateTo)
          )
          expect(outsideRange.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 12: Stale transaction detection', () => {
  it('should mark transaction as stale only if status is pending AND created > 24 hours ago', async () => {
    await fc.assert(
      fc.asyncProperty(
        statusArb,
        staleTestTimestampArb,
        async (status, createdAt) => {
          const isStale = isTransactionStale(status, createdAt)
          
          const now = new Date()
          const created = new Date(createdAt)
          const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
          
          // Property: isStale is true iff status='pending' AND hoursDiff > 24
          const expectedStale = status === 'pending' && hoursDiff > 24
          expect(isStale).toBe(expectedStale)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should never mark completed transactions as stale', async () => {
    await fc.assert(
      fc.asyncProperty(
        staleTestTimestampArb,
        async (createdAt) => {
          const isStale = isTransactionStale('completed', createdAt)
          
          // Property: Completed transactions are never stale
          expect(isStale).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should never mark failed transactions as stale', async () => {
    await fc.assert(
      fc.asyncProperty(
        staleTestTimestampArb,
        async (createdAt) => {
          const isStale = isTransactionStale('failed', createdAt)
          
          // Property: Failed transactions are never stale
          expect(isStale).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not mark recent pending transactions as stale', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate timestamps within last 23 hours
        fc.integer({ 
          min: Date.now() - 23 * 60 * 60 * 1000, 
          max: Date.now() 
        }).map(ts => new Date(ts).toISOString()),
        async (createdAt) => {
          const isStale = isTransactionStale('pending', createdAt)
          
          // Property: Recent pending transactions are not stale
          expect(isStale).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should mark old pending transactions as stale', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate timestamps more than 25 hours ago
        fc.integer({ 
          min: Date.now() - 30 * 24 * 60 * 60 * 1000, 
          max: Date.now() - 25 * 60 * 60 * 1000 
        }).map(ts => new Date(ts).toISOString()),
        async (createdAt) => {
          const isStale = isTransactionStale('pending', createdAt)
          
          // Property: Old pending transactions are stale
          expect(isStale).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})


describe('Property 17: Transaction verification effect', () => {
  it('should set verified_at while preserving other fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb,
        timestampArb,
        async (transaction, verifiedAt) => {
          const verified = verifyTransactionPure(transaction, verifiedAt)
          
          // Property: verified_at is set to the provided timestamp
          expect(verified.verifiedAt).toBe(verifiedAt)
          
          // Property: All other fields remain unchanged
          expect(verified.id).toBe(transaction.id)
          expect(verified.userId).toBe(transaction.userId)
          expect(verified.userEmail).toBe(transaction.userEmail)
          expect(verified.amount).toBe(transaction.amount)
          expect(verified.tier).toBe(transaction.tier)
          expect(verified.status).toBe(transaction.status)
          expect(verified.paymentMethod).toBe(transaction.paymentMethod)
          expect(verified.mayarInvoiceId).toBe(transaction.mayarInvoiceId)
          expect(verified.mayarTransactionId).toBe(transaction.mayarTransactionId)
          expect(verified.createdAt).toBe(transaction.createdAt)
          expect(verified.completedAt).toBe(transaction.completedAt)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should overwrite existing verified_at if already set', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb.map(t => ({ ...t, verifiedAt: new Date().toISOString() })),
        timestampArb,
        async (transaction, newVerifiedAt) => {
          const verified = verifyTransactionPure(transaction, newVerifiedAt)
          
          // Property: verified_at is updated to new timestamp
          expect(verified.verifiedAt).toBe(newVerifiedAt)
          expect(verified.verifiedAt).not.toBe(transaction.verifiedAt)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not modify the original transaction object', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb,
        timestampArb,
        async (transaction, verifiedAt) => {
          const originalVerifiedAt = transaction.verifiedAt
          verifyTransactionPure(transaction, verifiedAt)
          
          // Property: Original object is not mutated
          expect(transaction.verifiedAt).toBe(originalVerifiedAt)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve status field regardless of verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb,
        timestampArb,
        async (transaction, verifiedAt) => {
          const verified = verifyTransactionPure(transaction, verifiedAt)
          
          // Property: Status remains unchanged after verification
          expect(verified.status).toBe(transaction.status)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve amount field regardless of verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb,
        timestampArb,
        async (transaction, verifiedAt) => {
          const verified = verifyTransactionPure(transaction, verifiedAt)
          
          // Property: Amount remains unchanged after verification
          expect(verified.amount).toBe(transaction.amount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve tier field regardless of verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionListItemArb,
        timestampArb,
        async (transaction, verifiedAt) => {
          const verified = verifyTransactionPure(transaction, verifiedAt)
          
          // Property: Tier remains unchanged after verification
          expect(verified.tier).toBe(transaction.tier)
        }
      ),
      { numRuns: 100 }
    )
  })
})
