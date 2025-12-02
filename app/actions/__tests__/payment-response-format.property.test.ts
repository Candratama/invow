/**
 * Property-Based Test for Payment Server Action Response Format Consistency
 * 
 * **Feature: refactor-api-to-server-actions, Property 2: Server Action response format consistency**
 * **Validates: Requirements 1.2, 1.3, 5.2, 5.3**
 * 
 * Property: For any Server Action call, the response must follow the format 
 * `{ success: boolean, data?: T, error?: string }` where success=true implies 
 * data is present and success=false implies error is present.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the MayarPaymentService with configurable behavior
const mockCreateInvoice = vi.fn()
vi.mock('@/lib/db/services/mayar-payment.service', () => ({
  MayarPaymentService: class {
    createInvoice = mockCreateInvoice
  },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

import { createClient } from '@/lib/supabase/server'
import { createPaymentInvoiceAction } from '../payments'

describe('Property 2: Server Action response format consistency (Payment)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return response with success=false and error string when authentication fails', async () => {
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

          // Verify response format: success=false implies error is present
          expect(result).toHaveProperty('success')
          expect(typeof result.success).toBe('boolean')
          expect(result.success).toBe(false)
          
          // When success=false, error must be present and be a string
          expect(result).toHaveProperty('error')
          expect(typeof result.error).toBe('string')
          expect(result.error!.length).toBeGreaterThan(0)
          
          // When success=false, data should be undefined
          expect(result.data).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return response with success=true and data object when payment creation succeeds', async () => {
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

          // Mock successful payment creation
          mockCreateInvoice.mockResolvedValue({
            data: {
              invoiceId: 'test-invoice-id',
              paymentUrl: 'https://payment.example.com',
              amount: 100000,
            },
            error: null,
          })

          const result = await createPaymentInvoiceAction(tier)

          // Verify response format: success=true implies data is present
          expect(result).toHaveProperty('success')
          expect(typeof result.success).toBe('boolean')
          expect(result.success).toBe(true)
          
          // When success=true, data must be present with required fields
          expect(result).toHaveProperty('data')
          expect(result.data).toBeDefined()
          expect(result.data).toHaveProperty('invoiceId')
          expect(result.data).toHaveProperty('paymentUrl')
          expect(result.data).toHaveProperty('amount')
          expect(result.data).toHaveProperty('tier')
          expect(result.data!.tier).toBe(tier)
          
          // When success=true, error should be undefined
          expect(result.error).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return response with success=false and error string when payment service fails', async () => {
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

          // Mock failed payment creation
          mockCreateInvoice.mockResolvedValue({
            data: null,
            error: new Error('Payment service error'),
          })

          const result = await createPaymentInvoiceAction(tier)

          // Verify response format: success=false implies error is present
          expect(result).toHaveProperty('success')
          expect(typeof result.success).toBe('boolean')
          expect(result.success).toBe(false)
          
          // When success=false, error must be present and be a string
          expect(result).toHaveProperty('error')
          expect(typeof result.error).toBe('string')
          expect(result.error!.length).toBeGreaterThan(0)
          
          // When success=false, data should be undefined
          expect(result.data).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have consistent response shape across all scenarios', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('premium') as fc.Arbitrary<'premium'>,
        fc.boolean(), // authenticated or not
        fc.boolean(), // payment succeeds or not
        async (tier, isAuthenticated, paymentSucceeds) => {
          // Mock createClient based on authentication state
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: isAuthenticated ? { id: 'user-123', email: 'test@example.com' } : null },
                error: isAuthenticated ? null : new Error('Auth failed'),
              }),
            },
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          // Mock payment service based on success state
          if (paymentSucceeds) {
            mockCreateInvoice.mockResolvedValue({
              data: {
                invoiceId: 'test-invoice-id',
                paymentUrl: 'https://payment.example.com',
                amount: 100000,
              },
              error: null,
            })
          } else {
            mockCreateInvoice.mockResolvedValue({
              data: null,
              error: new Error('Payment failed'),
            })
          }

          const result = await createPaymentInvoiceAction(tier)

          // Verify consistent shape: always has 'success' property
          expect(result).toHaveProperty('success')
          expect(typeof result.success).toBe('boolean')
          
          // Verify mutual exclusivity: either data or error, not both
          if (result.success) {
            expect(result.data).toBeDefined()
            expect(result.error).toBeUndefined()
          } else {
            expect(result.error).toBeDefined()
            expect(typeof result.error).toBe('string')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
