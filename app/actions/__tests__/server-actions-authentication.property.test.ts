/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Property-Based Test for Server Action Authentication
 * 
 * **Feature: fix-database-architecture, Property 3: Server Actions authentication**
 * **Validates: Requirements 2.3, 9.3**
 * 
 * Property: For any Server Action that performs database operations, 
 * it must authenticate the user and return an error if authentication fails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the services
vi.mock('@/lib/db/services/user-preferences.service', () => ({
  UserPreferencesService: vi.fn(),
}))

vi.mock('@/lib/db/services/subscription.service', () => ({
  SubscriptionService: vi.fn(),
}))

vi.mock('@/lib/db/services', () => ({
  StoresService: vi.fn(),
  StoreContactsService: vi.fn(),
}))

vi.mock('@/lib/db/services/invoices.service', () => ({
  InvoicesService: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

import { createClient } from '@/lib/supabase/server'
import { updatePreferencesAction } from '../preferences'
import { upgradeSubscriptionAction } from '../subscription'
import { updateStoreAction, createContactAction } from '../store'
import { createInvoiceAction, deleteInvoiceAction } from '../invoices'

describe('Property 3: Server Actions Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Unauthorized error when authentication fails for any Server Action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'upgradeSubscription',
          'updateStore',
          'createContact',
          'createInvoice',
          'deleteInvoice'
        ),
        async (actionName) => {
          // Mock createClient to return auth error
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: new Error('Auth failed'),
              }),
            },
          }
          vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

          let result: any

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              result = await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'upgradeSubscription':
              result = await upgradeSubscriptionAction('premium')
              break
            case 'updateStore':
              result = await updateStoreAction({ name: 'Test Store' })
              break
            case 'createContact':
              result = await createContactAction({
                name: 'Test',
                phone: '123',
              })
              break
            case 'createInvoice':
              result = await createInvoiceAction(
                {
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  due_date: '2024-01-31',
                  status: 'draft',
                  subtotal: 100,
                  tax: 0,
                  total: 100,
                  notes: null,
                  terms: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_phone: null,
                  customer_address: null,
                },
                []
              )
              break
            case 'deleteInvoice':
              result = await deleteInvoiceAction('test-id')
              break
          }

          // Verify the result has the expected error structure
          expect(result).toHaveProperty('success', false)
          expect(result).toHaveProperty('error')
          expect(result.error).toBe('Unauthorized')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should check authentication before performing any database operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'upgradeSubscription',
          'updateStore',
          'createContact',
          'createInvoice',
          'deleteInvoice'
        ),
        async (actionName) => {
          // Mock createClient to return no user
          const mockSupabase = {
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
              }),
            },
          }
          vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

          let result: any

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              result = await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'upgradeSubscription':
              result = await upgradeSubscriptionAction('premium')
              break
            case 'updateStore':
              result = await updateStoreAction({ name: 'Test Store' })
              break
            case 'createContact':
              result = await createContactAction({
                name: 'Test',
                phone: '123',
              })
              break
            case 'createInvoice':
              result = await createInvoiceAction(
                {
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  due_date: '2024-01-31',
                  status: 'draft',
                  subtotal: 100,
                  tax: 0,
                  total: 100,
                  notes: null,
                  terms: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_phone: null,
                  customer_address: null,
                },
                []
              )
              break
            case 'deleteInvoice':
              result = await deleteInvoiceAction('test-id')
              break
          }

          // Verify authentication was checked
          expect(mockSupabase.auth.getUser).toHaveBeenCalled()
          
          // Verify the result indicates unauthorized
          expect(result.success).toBe(false)
          expect(result.error).toBe('Unauthorized')
        }
      ),
      { numRuns: 100 }
    )
  })
})
