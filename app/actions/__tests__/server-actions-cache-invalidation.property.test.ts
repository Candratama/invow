/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Property-Based Test for Server Actions Cache Invalidation
 * 
 * **Feature: fix-database-architecture, Property 4: Server Actions cache invalidation**
 * **Validates: Requirements 2.2**
 * 
 * Property: For any Server Action that successfully modifies data, 
 * it must call revalidatePath() for affected routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the services
vi.mock('@/lib/db/services/user-preferences.service', () => ({
  UserPreferencesService: class {
    updatePreferences = vi.fn().mockResolvedValue({ data: {}, error: null })
    updateExportQuality = vi.fn().mockResolvedValue({ data: {}, error: null })
    updateTaxSettings = vi.fn().mockResolvedValue({ data: {}, error: null })
    updateSelectedTemplate = vi.fn().mockResolvedValue({ data: {}, error: null })
  },
}))

vi.mock('@/lib/db/services/subscription.service', () => ({
  SubscriptionService: class {
    upgradeToTier = vi.fn().mockResolvedValue({ success: true, data: {} })
  },
}))

vi.mock('@/lib/db/services', () => ({
  StoresService: class {
    getDefaultStore = vi.fn().mockResolvedValue({ data: { id: 'store-1' }, error: null })
    updateStore = vi.fn().mockResolvedValue({ data: {}, error: null })
  },
  StoreContactsService: class {
    createContact = vi.fn().mockResolvedValue({ data: {}, error: null })
    updateContact = vi.fn().mockResolvedValue({ data: {}, error: null })
    deleteContact = vi.fn().mockResolvedValue({ success: true, error: null })
    setPrimaryContact = vi.fn().mockResolvedValue({ success: true, error: null })
  },
}))

vi.mock('@/lib/db/services/invoices.service', () => ({
  InvoicesService: class {
    createInvoice = vi.fn().mockResolvedValue({ data: { id: 'inv-1' }, error: null })
    updateInvoice = vi.fn().mockResolvedValue({ data: {}, error: null })
    deleteInvoice = vi.fn().mockResolvedValue({ success: true, error: null })
  },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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

describe('Property 4: Server Actions Cache Invalidation', () => {
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

  it('should call revalidatePath after successful mutation for any Server Action', async () => {
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
          vi.mocked(revalidatePath).mockClear()

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
                phone: '123',
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
            case 'updateInvoice':
              result = await updateInvoiceAction('inv-1', { status: 'pending' })
              break
            case 'deleteInvoice':
              result = await deleteInvoiceAction('inv-1')
              break
          }

          // If the action was successful, revalidatePath should have been called
          if (result.success || result.success === undefined) {
            expect(revalidatePath).toHaveBeenCalled()
            
            // Verify at least one path was revalidated
            expect(vi.mocked(revalidatePath).mock.calls.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should revalidate appropriate paths for each action type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          actionType: fc.constantFrom('preferences', 'subscription', 'store', 'invoice'),
        }),
        async ({ actionType }) => {
          vi.mocked(revalidatePath).mockClear()

          // Call an action of the specified type
          switch (actionType) {
            case 'preferences':
              await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'subscription':
              await upgradeSubscriptionAction('premium')
              break
            case 'store':
              await updateStoreAction({ name: 'Test' })
              break
            case 'invoice':
              await createInvoiceAction(
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
          }

          // Verify revalidatePath was called
          expect(revalidatePath).toHaveBeenCalled()

          // Get all paths that were revalidated
          const revalidatedPaths = vi.mocked(revalidatePath).mock.calls.map(call => call[0])

          // Verify common paths are revalidated
          const hasAccountOrDashboard = revalidatedPaths.some(
            path => path === '/account' || path === '/dashboard'
          )
          expect(hasAccountOrDashboard).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
