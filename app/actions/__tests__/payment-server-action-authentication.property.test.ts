/**
 * Property-Based Test for Payment Server Action Authentication
 * 
 * **Feature: refactor-api-to-server-actions, Property 1: Server Actions have authentication guards**
 * **Validates: Requirements 1.4, 5.1**
 * 
 * Property: For any Server Action that accesses user data, the action must check 
 * authentication before performing any database operation and return an unauthorized 
 * error if the user is not authenticated.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the MayarPaymentService
vi.mock('@/lib/db/services/mayar-payment.service', () => ({
  MayarPaymentService: class {
    createInvoice = vi.fn().mockResolvedValue({
      data: {
        invoiceId: 'test-invoice-id',
        paymentUrl: 'https://payment.example.com',
        amount: 100000,
      },
      error: null,
    })
  },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createPaymentInvoiceAction } from '../payments'

describe('Property 1: Server Actions have authentication guards (Payment)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Unauthorized error when authentication fails for createPaymentInvoiceAction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('premium') as fc.Arbitrary<'premium'>,
        async (tier) => {
          // Mock createClient to return auth error
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: new Error('Auth failed'),
              }),
            },
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await createPaymentInvoiceAction(tier)

          // Verify the result has the expected error structure
          expect(result).toHaveProperty('success', false)
          expect(result).toHaveProperty('error')
          expect(result.error).toBe('Unauthorized - Please log in to continue')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should check authentication before performing any payment operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('premium') as fc.Arbitrary<'premium'>,
        async (tier) => {
          // Mock createClient to return no user (null user without error)
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
              }),
            },
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await createPaymentInvoiceAction(tier)

          // Verify authentication was checked
          expect(mockSupabase.auth.getUser).toHaveBeenCalled()
          
          // Verify the result indicates unauthorized
          expect(result.success).toBe(false)
          expect(result.error).toBe('Unauthorized - Please log in to continue')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should proceed with payment creation when user is authenticated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('premium') as fc.Arbitrary<'premium'>,
        async (tier) => {
          // Mock createClient to return authenticated user
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
              }),
            },
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await createPaymentInvoiceAction(tier)

          // Verify authentication was checked
          expect(mockSupabase.auth.getUser).toHaveBeenCalled()
          
          // Verify success response (MayarPaymentService was called since auth passed)
          expect(result.success).toBe(true)
          expect(result.data).toBeDefined()
          expect(result.data?.tier).toBe(tier)
        }
      ),
      { numRuns: 100 }
    )
  })
})
