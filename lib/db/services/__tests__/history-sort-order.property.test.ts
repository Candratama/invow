/**
 * Property-Based Test for History Sort Order
 * 
 * **Feature: premium-feature-gating, Property 9: History sort order**
 * **Validates: Requirements 7.4**
 * 
 * Property: For any history query, results should be sorted by date in descending order (newest first).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'

// Define transaction type for testing
interface Transaction {
  id: string
  createdAt: Date
}

/**
 * Pure function that sorts transactions by date in descending order (newest first)
 * This mirrors the sorting logic used in InvoicesService
 */
function sortTransactionsByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Helper to check if an array is sorted in descending order by date
 */
function isSortedDescByDate(transactions: Transaction[]): boolean {
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i - 1].createdAt.getTime() < transactions[i].createdAt.getTime()) {
      return false
    }
  }
  return true
}

/**
 * Generator for random transactions with valid dates
 * Filters out invalid dates (NaN) to ensure test stability
 */
const validDateArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2025-12-31'),
}).filter(d => !isNaN(d.getTime()))

const transactionArb = fc.record({
  id: fc.uuid(),
  createdAt: validDateArb,
})

describe('Property 9: History sort order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sort transactions in descending order (newest first) for any input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 0, maxLength: 100 }),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          // Verify the result is sorted in descending order
          expect(isSortedDescByDate(sorted)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve all transactions after sorting (no data loss)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          // Same length
          expect(sorted.length).toBe(transactions.length)

          // All original IDs should be present
          const originalIds = new Set(transactions.map(t => t.id))
          const sortedIds = new Set(sorted.map(t => t.id))
          expect(sortedIds).toEqual(originalIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should place newest transaction first for any non-empty list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          // Find the actual newest transaction
          const newestDate = Math.max(...transactions.map(t => t.createdAt.getTime()))

          // First element should have the newest date
          expect(sorted[0].createdAt.getTime()).toBe(newestDate)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should place oldest transaction last for any non-empty list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 1, maxLength: 50 }),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          // Find the actual oldest transaction
          const oldestDate = Math.min(...transactions.map(t => t.createdAt.getTime()))

          // Last element should have the oldest date
          expect(sorted[sorted.length - 1].createdAt.getTime()).toBe(oldestDate)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty transaction list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([] as Transaction[]),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          expect(sorted.length).toBe(0)
          expect(isSortedDescByDate(sorted)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle single transaction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 1, maxLength: 1 }),
        async (transactions) => {
          const sorted = sortTransactionsByDateDesc(transactions)

          expect(sorted.length).toBe(1)
          expect(sorted[0].id).toBe(transactions[0].id)
          expect(isSortedDescByDate(sorted)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle transactions with same date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({
          min: new Date('2020-01-01'),
          max: new Date('2025-12-31'),
        }),
        fc.integer({ min: 2, max: 10 }),
        async (sameDate, count) => {
          // Create transactions with the same date
          const transactions: Transaction[] = Array.from({ length: count }, (_, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(sameDate),
          }))

          const sorted = sortTransactionsByDateDesc(transactions)

          // All should have the same date
          expect(sorted.length).toBe(count)
          expect(isSortedDescByDate(sorted)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should be idempotent - sorting twice gives same result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
        async (transactions) => {
          const sortedOnce = sortTransactionsByDateDesc(transactions)
          const sortedTwice = sortTransactionsByDateDesc(sortedOnce)

          // Should be identical
          expect(sortedTwice.length).toBe(sortedOnce.length)
          for (let i = 0; i < sortedOnce.length; i++) {
            expect(sortedTwice[i].id).toBe(sortedOnce[i].id)
            expect(sortedTwice[i].createdAt.getTime()).toBe(sortedOnce[i].createdAt.getTime())
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain relative order for consecutive dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 20 }),
        async (count) => {
          const now = new Date()
          // Create transactions with consecutive dates (each day apart)
          const transactions: Transaction[] = Array.from({ length: count }, (_, i) => ({
            id: `txn-${i}`,
            createdAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
          }))

          // Shuffle the transactions
          const shuffled = [...transactions].sort(() => Math.random() - 0.5)

          const sorted = sortTransactionsByDateDesc(shuffled)

          // Verify descending order
          expect(isSortedDescByDate(sorted)).toBe(true)

          // First should be the newest (index 0 from original)
          expect(sorted[0].id).toBe('txn-0')
          // Last should be the oldest
          expect(sorted[sorted.length - 1].id).toBe(`txn-${count - 1}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})
