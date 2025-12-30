/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Property-Based Test for Server Action Error Response Structure
 * 
 * **Feature: fix-database-architecture, Property 8: Error response structure**
 * **Validates: Requirements 2.5, 9.1, 9.2**
 * 
 * Property: For any Server Action that fails, it must return an object 
 * with success: false and an error message string
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the services to return errors
vi.mock('@/lib/db/services/user-preferences.service', () => ({
  UserPreferencesService: class {
    updatePreferences = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Database error') 
    })
    updateExportQuality = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Invalid quality') 
    })
    updateTaxSettings = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Tax update failed') 
    })
    updateSelectedTemplate = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Template not found') 
    })
  },
}))

vi.mock('@/lib/db/services/subscription.service', () => ({
  SubscriptionService: class {
    upgradeToTier = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Payment failed' 
    })
  },
}))

vi.mock('@/lib/db/services', () => ({
  StoresService: class {
    getDefaultStore = vi.fn().mockResolvedValue({ data: { id: 'store-1' }, error: null })
    updateStore = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Store update failed') 
    })
  },
  StoreContactsService: class {
    createContact = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Contact creation failed') 
    })
    updateContact = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Contact update failed') 
    })
    deleteContact = vi.fn().mockResolvedValue({ 
      success: false, 
      error: new Error('Contact deletion failed') 
    })
    setPrimaryContact = vi.fn().mockResolvedValue({ 
      success: false, 
      error: new Error('Failed to set primary') 
    })
  },
}))

vi.mock('@/lib/db/services/invoices.service', () => ({
  InvoicesService: class {
    createInvoice = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Invoice creation failed') 
    })
    updateInvoice = vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Invoice update failed') 
    })
    deleteInvoice = vi.fn().mockResolvedValue({ 
      success: false, 
      error: new Error('Invoice deletion failed') 
    })
  },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

import { createClient } from '@/lib/supabase/server'
import { 
  updatePreferencesAction, 
  updateExportQualityAction,
  updateTaxSettingsAction,
  updateSelectedTemplateAction 
} from '../preferences'
import { upgradeSubscriptionAction } from '../subscription'
import { 
  updateStoreAction, 
  createContactAction, 
  updateContactAction,
  deleteContactAction,
  setPrimaryContactAction 
} from '../store'
import { createInvoiceAction, updateInvoiceAction, deleteInvoiceAction } from '../invoices'

describe('Property 8: Error Response Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful authentication
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should return error object with success: false and error message for any failed Server Action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'updateExportQuality',
          'updateTaxSettings',
          'updateSelectedTemplate',
          'upgradeSubscription',
          'updateStore',
          'createContact',
          'updateContact',
          'deleteContact',
          'setPrimaryContact',
          'createInvoice',
          'updateInvoice',
          'deleteInvoice'
        ),
        async (actionName) => {
          let result: any

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              result = await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'updateExportQuality':
              result = await updateExportQualityAction(100)
              break
            case 'updateTaxSettings':
              result = await updateTaxSettingsAction(true, 10)
              break
            case 'updateSelectedTemplate':
              result = await updateSelectedTemplateAction('classic')
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
                title: 'Manager',
              })
              break
            case 'updateContact':
              result = await updateContactAction('contact-1', {
                name: 'Updated',
              })
              break
            case 'deleteContact':
              result = await deleteContactAction('contact-1')
              break
            case 'setPrimaryContact':
              result = await setPrimaryContactAction('store-1', 'contact-1')
              break
            case 'createInvoice':
              result = await createInvoiceAction(
                {
                  store_id: 'store-123',
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  status: 'draft',
                  subtotal: 100,
                  tax_amount: 0,
                  total: 100,
                  note: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_phone: null,
                  customer_address: null,
                },
                []
              )
              break
            case 'updateInvoice':
              result = await updateInvoiceAction('inv-1', { status: 'pending' })
              break
            case 'deleteInvoice':
              result = await deleteInvoiceAction('inv-1')
              break
          }

          // Verify error response structure
          expect(result).toHaveProperty('success')
          expect(result.success).toBe(false)
          expect(result).toHaveProperty('error')
          expect(typeof result.error).toBe('string')
          expect(result.error.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not expose sensitive information in error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'updateStore',
          'createContact',
          'createInvoice'
        ),
        async (actionName) => {
          let result: any

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              result = await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'updateStore':
              result = await updateStoreAction({ name: 'Test Store' })
              break
            case 'createContact':
              result = await createContactAction({
                name: 'Test',
                title: 'Manager',
              })
              break
            case 'createInvoice':
              result = await createInvoiceAction(
                {
                  store_id: 'store-123',
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  status: 'draft',
                  subtotal: 100,
                  tax_amount: 0,
                  total: 100,
                  note: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_phone: null,
                  customer_address: null,
                },
                []
              )
              break
          }

          // Verify no sensitive patterns in error message
          const sensitivePatterns = [
            /password/i,
            /token/i,
            /secret/i,
            /api[_-]?key/i,
            /user[_-]?id:\s*[a-f0-9-]{36}/i, // UUID pattern
          ]

          const errorMessage = result.error.toLowerCase()
          
          for (const pattern of sensitivePatterns) {
            expect(errorMessage).not.toMatch(pattern)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have consistent error response shape across all actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'updateStore',
          'createContact',
          'deleteInvoice'
        ),
        async (actionName) => {
          let result: any

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              result = await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'updateStore':
              result = await updateStoreAction({ name: 'Test Store' })
              break
            case 'createContact':
              result = await createContactAction({
                name: 'Test',
                title: 'Manager',
              })
              break
            case 'deleteInvoice':
              result = await deleteInvoiceAction('inv-1')
              break
          }

          // Verify consistent shape
          const keys = Object.keys(result).sort()
          expect(keys).toContain('success')
          expect(keys).toContain('error')
          
          // Should not have 'data' property when there's an error
          if (result.success === false) {
            expect(result.data).toBeUndefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
