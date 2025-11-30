/**
 * Property-Based Test for Invoice Loading Server Action Authentication
 * 
 * **Feature: refactor-api-to-server-actions, Property 1: Server Actions have authentication guards**
 * **Validates: Requirements 5.1**
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

// Mock the InvoicesService
vi.mock('@/lib/db/services/invoices.service', () => ({
  InvoicesService: class {
    getInvoiceWithItems = vi.fn().mockResolvedValue({
      data: {
        id: 'test-invoice-id',
        invoice_number: 'INV-001',
        invoice_date: '2024-01-01',
        due_date: '2024-01-31',
        status: 'draft',
        subtotal: 100,
        tax: 0,
        total: 100,
        invoice_items: [],
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
import { getInvoiceByIdAction } from '../invoices'

describe('Property 1: Server Actions have authentication guards (Invoice Loading)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Unauthorized error when authentication fails for getInvoiceByIdAction', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random invoice IDs (UUIDs or any string)
        fc.uuid(),
        async (invoiceId) => {
          // Mock createClient to return auth error
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: new Error('Auth failed'),
              }),
            },
          }
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await getInvoiceByIdAction(invoiceId)

          // Verify the result has the expected error structure
          expect(result).toHaveProperty('success', false)
          expect(result).toHaveProperty('error')
          expect(result.error).toBe('Unauthorized')
          expect(result.data).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should check authentication before performing any invoice fetch operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random invoice IDs
        fc.uuid(),
        async (invoiceId) => {
          // Mock createClient to return no user (null user without error)
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
              }),
            },
          }
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await getInvoiceByIdAction(invoiceId)

          // Verify authentication was checked
          expect(mockSupabase.auth.getUser).toHaveBeenCalled()
          
          // Verify the result indicates unauthorized
          expect(result.success).toBe(false)
          expect(result.error).toBe('Unauthorized')
          expect(result.data).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should proceed with invoice fetch when user is authenticated', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random invoice IDs
        fc.uuid(),
        async (invoiceId) => {
          // Mock createClient to return authenticated user
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
              }),
            },
          }
          vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

          const result = await getInvoiceByIdAction(invoiceId)

          // Verify authentication was checked
          expect(mockSupabase.auth.getUser).toHaveBeenCalled()
          
          // Verify success response (InvoicesService was called since auth passed)
          expect(result.success).toBe(true)
          expect(result.data).toBeDefined()
          expect(result.data?.id).toBe('test-invoice-id')
        }
      ),
      { numRuns: 100 }
    )
  })
})
