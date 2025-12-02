/**
 * Property-Based Tests for User Filters
 *
 * **Feature: admin-panel-phase1, Property 6: Tier filter correctness**
 * **Feature: admin-panel-phase1, Property 7: Search filter correctness**
 * **Feature: admin-panel-phase1, Property 18: Pagination bounds**
 * **Validates: Requirements 3.3, 3.5, 3.7**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Types matching the admin-users service
interface UserListItem {
  id: string
  email: string
  tier: string
  subscriptionStatus: 'active' | 'expired' | 'none'
  invoiceCount: number
  currentMonthCount: number
  invoiceLimit: number
  createdAt: string
}

interface UserFilters {
  tier?: 'free' | 'premium' | 'all'
  status?: 'active' | 'expired' | 'all'
  search?: string
  page?: number
  pageSize?: number
}

/**
 * Pure function that applies tier filter to users
 * Mirrors the logic in admin-users.service.ts
 */
function applyTierFilter(users: UserListItem[], tier?: 'free' | 'premium' | 'all'): UserListItem[] {
  if (!tier || tier === 'all') {
    return users
  }
  return users.filter((u) => u.tier === tier)
}

/**
 * Pure function that applies search filter to users
 * Mirrors the logic in admin-users.service.ts
 */
function applySearchFilter(users: UserListItem[], search?: string): UserListItem[] {
  if (!search || !search.trim()) {
    return users
  }
  const searchLower = search.toLowerCase().trim()
  return users.filter((u) => u.email.toLowerCase().includes(searchLower))
}

/**
 * Pure function that applies pagination to users
 * Mirrors the logic in admin-users.service.ts
 */
function applyPagination(
  users: UserListItem[],
  page: number = 1,
  pageSize: number = 10
): { paginatedUsers: UserListItem[]; total: number } {
  const total = users.length
  const offset = (page - 1) * pageSize
  const paginatedUsers = users.slice(offset, offset + pageSize)
  return { paginatedUsers, total }
}

/**
 * Combined filter function that applies all filters
 */
function applyFilters(
  users: UserListItem[],
  filters: UserFilters
): { users: UserListItem[]; total: number } {
  let filtered = [...users]
  
  // Apply tier filter
  filtered = applyTierFilter(filtered, filters.tier)
  
  // Apply search filter
  filtered = applySearchFilter(filtered, filters.search)
  
  // Apply pagination
  const { paginatedUsers, total } = applyPagination(
    filtered,
    filters.page,
    filters.pageSize
  )
  
  return { users: paginatedUsers, total }
}

// Generators
const tierArb = fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>
// tierFilterArb is available for future use in tier filter tests
// const tierFilterArb = fc.constantFrom('free', 'premium', 'all') as fc.Arbitrary<'free' | 'premium' | 'all'>
const statusArb = fc.constantFrom('active', 'expired', 'none') as fc.Arbitrary<'active' | 'expired' | 'none'>

const userListItemArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  tier: tierArb,
  subscriptionStatus: statusArb,
  invoiceCount: fc.nat({ max: 1000 }),
  currentMonthCount: fc.nat({ max: 200 }),
  invoiceLimit: fc.constantFrom(10, 200),
  createdAt: fc.integer({ min: 1577836800000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
})

const usersListArb = fc.array(userListItemArb, { minLength: 0, maxLength: 50 })

describe('Property 6: Tier filter correctness', () => {
  it('should return only users matching the selected tier when filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        async (users, tierFilter) => {
          const filtered = applyTierFilter(users, tierFilter)
          
          // Property: All returned users have tier matching the filter
          for (const user of filtered) {
            expect(user.tier).toBe(tierFilter)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all users when tier filter is "all"', async () => {
    await fc.assert(
      fc.asyncProperty(usersListArb, async (users) => {
        const filtered = applyTierFilter(users, 'all')
        
        // Property: All users are returned when filter is 'all'
        expect(filtered.length).toBe(users.length)
        expect(filtered).toEqual(users)
      }),
      { numRuns: 100 }
    )
  })

  it('should return all users when tier filter is undefined', async () => {
    await fc.assert(
      fc.asyncProperty(usersListArb, async (users) => {
        const filtered = applyTierFilter(users, undefined)
        
        // Property: All users are returned when filter is undefined
        expect(filtered.length).toBe(users.length)
        expect(filtered).toEqual(users)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve the count of users with matching tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        async (users, tierFilter) => {
          const filtered = applyTierFilter(users, tierFilter)
          const expectedCount = users.filter(u => u.tier === tierFilter).length
          
          // Property: Filtered count equals count of users with matching tier
          expect(filtered.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not include users with non-matching tier', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        async (users, tierFilter) => {
          const filtered = applyTierFilter(users, tierFilter)
          const otherTier = tierFilter === 'free' ? 'premium' : 'free'
          
          // Property: No users with non-matching tier in results
          const hasOtherTier = filtered.some(u => u.tier === otherTier)
          expect(hasOtherTier).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 7: Search filter correctness', () => {
  it('should return only users with email containing search term (case-insensitive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        async (users, searchTerm) => {
          const filtered = applySearchFilter(users, searchTerm)
          const searchLower = searchTerm.toLowerCase().trim()
          
          // Property: All returned users have email containing search term
          for (const user of filtered) {
            expect(user.email.toLowerCase()).toContain(searchLower)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all users when search is empty string', async () => {
    await fc.assert(
      fc.asyncProperty(usersListArb, async (users) => {
        const filtered = applySearchFilter(users, '')
        
        // Property: All users returned when search is empty
        expect(filtered.length).toBe(users.length)
        expect(filtered).toEqual(users)
      }),
      { numRuns: 100 }
    )
  })

  it('should return all users when search is whitespace only', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('   ', '\t', '\n', '  \t  ', '\n\n'),
        async (users, whitespace) => {
          const filtered = applySearchFilter(users, whitespace)
          
          // Property: All users returned when search is whitespace
          expect(filtered.length).toBe(users.length)
          expect(filtered).toEqual(users)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all users when search is undefined', async () => {
    await fc.assert(
      fc.asyncProperty(usersListArb, async (users) => {
        const filtered = applySearchFilter(users, undefined)
        
        // Property: All users returned when search is undefined
        expect(filtered.length).toBe(users.length)
        expect(filtered).toEqual(users)
      }),
      { numRuns: 100 }
    )
  })

  it('should be case-insensitive in search matching', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        async (users, searchTerm) => {
          const lowerResult = applySearchFilter(users, searchTerm.toLowerCase())
          const upperResult = applySearchFilter(users, searchTerm.toUpperCase())
          const mixedResult = applySearchFilter(users, searchTerm)
          
          // Property: Case variations produce same results
          expect(lowerResult.length).toBe(upperResult.length)
          expect(lowerResult.length).toBe(mixedResult.length)
          expect(lowerResult.map(u => u.id).sort()).toEqual(upperResult.map(u => u.id).sort())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not include users without matching email', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        async (users, searchTerm) => {
          const filtered = applySearchFilter(users, searchTerm)
          const searchLower = searchTerm.toLowerCase().trim()
          
          // Property: All non-matching users are excluded
          const nonMatchingInResults = filtered.filter(
            u => !u.email.toLowerCase().includes(searchLower)
          )
          expect(nonMatchingInResults.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 18: Pagination bounds', () => {
  it('should return correct number of items based on page and pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        async (users, page, pageSize) => {
          const { paginatedUsers, total } = applyPagination(users, page, pageSize)
          const offset = (page - 1) * pageSize
          const expectedCount = Math.max(0, Math.min(pageSize, total - offset))
          
          // Property: Returned count is min(pageSize, total - offset) or 0 if offset >= total
          expect(paginatedUsers.length).toBe(expectedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return total count equal to input array length', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        async (users, page, pageSize) => {
          const { total } = applyPagination(users, page, pageSize)
          
          // Property: Total equals input array length
          expect(total).toBe(users.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return items starting at correct offset', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb.filter(arr => arr.length > 0),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (users, page, pageSize) => {
          const { paginatedUsers } = applyPagination(users, page, pageSize)
          const offset = (page - 1) * pageSize
          
          if (paginatedUsers.length > 0 && offset < users.length) {
            // Property: First item in paginated result is at correct offset
            expect(paginatedUsers[0]).toEqual(users[offset])
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return empty array when page is beyond total pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.integer({ min: 1, max: 10 }),
        async (users, pageSize) => {
          const totalPages = Math.ceil(users.length / pageSize)
          const beyondPage = totalPages + 1
          const { paginatedUsers } = applyPagination(users, beyondPage, pageSize)
          
          // Property: Empty result when page exceeds total pages
          if (users.length > 0) {
            expect(paginatedUsers.length).toBe(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use default values when page and pageSize are not provided', async () => {
    await fc.assert(
      fc.asyncProperty(usersListArb, async (users) => {
        const { paginatedUsers, total } = applyPagination(users)
        const expectedCount = Math.min(10, users.length) // default pageSize is 10
        
        // Property: Default pagination returns first 10 items
        expect(paginatedUsers.length).toBe(expectedCount)
        expect(total).toBe(users.length)
        
        if (users.length > 0) {
          expect(paginatedUsers[0]).toEqual(users[0])
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain item order within paginated results', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb.filter(arr => arr.length >= 3),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 2, max: 5 }),
        async (users, page, pageSize) => {
          const { paginatedUsers } = applyPagination(users, page, pageSize)
          const offset = (page - 1) * pageSize
          
          // Property: Items maintain their relative order
          for (let i = 0; i < paginatedUsers.length; i++) {
            expect(paginatedUsers[i]).toEqual(users[offset + i])
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle page 1 correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb.filter(arr => arr.length > 0),
        fc.integer({ min: 1, max: 20 }),
        async (users, pageSize) => {
          const { paginatedUsers } = applyPagination(users, 1, pageSize)
          const expectedCount = Math.min(pageSize, users.length)
          
          // Property: Page 1 returns first pageSize items
          expect(paginatedUsers.length).toBe(expectedCount)
          expect(paginatedUsers[0]).toEqual(users[0])
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Combined filters integration', () => {
  it('should apply tier filter before pagination', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (users, tierFilter, page, pageSize) => {
          const result = applyFilters(users, { tier: tierFilter, page, pageSize })
          
          // Property: All returned users match tier filter
          for (const user of result.users) {
            expect(user.tier).toBe(tierFilter)
          }
          
          // Property: Total reflects filtered count, not original count
          const filteredCount = users.filter(u => u.tier === tierFilter).length
          expect(result.total).toBe(filteredCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should apply search filter before pagination', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        async (users, search, page, pageSize) => {
          const result = applyFilters(users, { search, page, pageSize })
          const searchLower = search.toLowerCase().trim()
          
          // Property: All returned users match search filter
          for (const user of result.users) {
            expect(user.email.toLowerCase()).toContain(searchLower)
          }
          
          // Property: Total reflects filtered count
          const filteredCount = users.filter(
            u => u.email.toLowerCase().includes(searchLower)
          ).length
          expect(result.total).toBe(filteredCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should apply both tier and search filters correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        fc.string({ minLength: 1, maxLength: 3 }).filter(s => s.trim().length > 0),
        async (users, tierFilter, search) => {
          const result = applyFilters(users, { tier: tierFilter, search, page: 1, pageSize: 100 })
          const searchLower = search.toLowerCase().trim()
          
          // Property: All returned users match both filters
          for (const user of result.users) {
            expect(user.tier).toBe(tierFilter)
            expect(user.email.toLowerCase()).toContain(searchLower)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
