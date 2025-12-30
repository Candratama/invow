/**
 * Property-Based Test for Targeted Cache Revalidation
 * 
 * **Feature: optimize-navigation-performance, Property 5: Targeted cache revalidation**
 * **Validates: Requirements 6.3, 6.4**
 * 
 * Property: For any Server Action that calls revalidatePath, the path argument 
 * SHALL be a specific route path, not a catch-all pattern
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

vi.mock('@/lib/db/services', () => ({
  StoresService: class {
    getDefaultStore = vi.fn().mockResolvedValue({ data: { id: 'store-1' }, error: null })
    createStore = vi.fn().mockResolvedValue({ data: { id: 'store-1' }, error: null })
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
    updateInvoiceWithItems = vi.fn().mockResolvedValue({ data: {}, error: null })
    deleteInvoice = vi.fn().mockResolvedValue({ success: true, error: null })
    upsertInvoiceWithItems = vi.fn().mockResolvedValue({ data: { id: 'inv-1' }, error: null })
  },
}))

// Track all revalidatePath calls
const revalidatePathCalls: string[] = []
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn((path: string) => {
    revalidatePathCalls.push(path)
  }),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(), // Next.js 16 renamed revalidateTag to updateTag
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
import { 
  updateStoreAction, 
  createContactAction, 
  updateContactAction,
  deleteContactAction,
  setPrimaryContactAction 
} from '../store'
import { 
  createInvoiceAction, 
  updateInvoiceAction, 
  deleteInvoiceAction,
  upsertInvoiceWithItemsAction 
} from '../invoices'

// Patterns that indicate catch-all or overly broad invalidation
const INVALID_PATTERNS = [
  /^\/$/, // Root path alone (too broad)
  /\/\*/, // Catch-all patterns like /dashboard/*
  /\[\[/, // Catch-all segments like [[...slug]]
  /\[\.\.\./, // Rest parameters like [...slug]
  /^\/account$/, // Incorrect path (should be /dashboard/settings)
]

/**
 * Checks if a path is a valid specific route path
 */
function isValidSpecificPath(path: string): boolean {
  // Check against invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(path)) {
      return false
    }
  }
  
  // Path should start with /
  if (!path.startsWith('/')) {
    return false
  }
  
  // Path should not contain wildcards
  if (path.includes('*')) {
    return false
  }
  
  // Path should be a known valid route or follow the pattern
  return true
}

describe('Property 5: Targeted Cache Revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    revalidatePathCalls.length = 0
    
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should use specific route paths (not catch-all patterns) for all revalidatePath calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'updateExportQuality',
          'updateTaxSettings',
          'updateSelectedTemplate',
          'updateStore',
          'createContact',
          'updateContact',
          'deleteContact',
          'setPrimaryContact',
          'createInvoice',
          'updateInvoice',
          'deleteInvoice',
          'upsertInvoice'
        ),
        async (actionName) => {
          revalidatePathCalls.length = 0
          vi.mocked(revalidatePath).mockClear()

          // Call the appropriate action
          switch (actionName) {
            case 'updatePreferences':
              await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'updateExportQuality':
              await updateExportQualityAction(100)
              break
            case 'updateTaxSettings':
              await updateTaxSettingsAction(true, 10)
              break
            case 'updateSelectedTemplate':
              await updateSelectedTemplateAction('classic')
              break
            case 'updateStore':
              await updateStoreAction({ name: 'Test Store' })
              break
            case 'createContact':
              await createContactAction({ name: 'Test', title: 'Manager' })
              break
            case 'updateContact':
              await updateContactAction('contact-1', { name: 'Updated' })
              break
            case 'deleteContact':
              await deleteContactAction('contact-1')
              break
            case 'setPrimaryContact':
              await setPrimaryContactAction('store-1', 'contact-1')
              break
            case 'createInvoice':
              await createInvoiceAction(
                {
                  store_id: 'store-1',
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  status: 'draft',
                  subtotal: 100,
                  tax_amount: 0,
                  total: 100,
                  note: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_address: null,
                },
                []
              )
              break
            case 'updateInvoice':
              await updateInvoiceAction('inv-1', { status: 'pending' })
              break
            case 'deleteInvoice':
              await deleteInvoiceAction('inv-1')
              break
            case 'upsertInvoice':
              await upsertInvoiceWithItemsAction(
                {
                  store_id: 'store-1',
                  invoice_number: 'INV-002',
                  invoice_date: '2024-01-01',
                  status: 'draft',
                  subtotal: 100,
                  tax_amount: 0,
                  total: 100,
                  note: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_address: null,
                },
                []
              )
              break
          }

          // Get all paths that were revalidated
          const revalidatedPaths = vi.mocked(revalidatePath).mock.calls.map(call => call[0])

          // Verify each path is a valid specific route
          for (const path of revalidatedPaths) {
            expect(isValidSpecificPath(path)).toBe(true)
          }

          // Verify no catch-all patterns are used
          for (const path of revalidatedPaths) {
            expect(path).not.toContain('*')
            expect(path).not.toContain('[[')
            expect(path).not.toContain('[...')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should only revalidate routes that are affected by the mutation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          actionType: fc.constantFrom('store', 'contact', 'preferences', 'invoice'),
        }),
        async ({ actionType }) => {
          revalidatePathCalls.length = 0
          vi.mocked(revalidatePath).mockClear()

          // Call an action of the specified type
          switch (actionType) {
            case 'store':
              await updateStoreAction({ name: 'Test' })
              break
            case 'contact':
              await createContactAction({ name: 'Test', title: 'Manager' })
              break
            case 'preferences':
              await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'invoice':
              await createInvoiceAction(
                {
                  store_id: 'store-1',
                  invoice_number: 'INV-001',
                  invoice_date: '2024-01-01',
                  status: 'draft',
                  subtotal: 100,
                  tax_amount: 0,
                  total: 100,
                  note: null,
                  customer_name: 'Test',
                  customer_email: null,
                  customer_address: null,
                },
                []
              )
              break
          }

          const revalidatedPaths = vi.mocked(revalidatePath).mock.calls.map(call => call[0])

          // Contact actions should only affect settings page
          if (actionType === 'contact') {
            expect(revalidatedPaths).toContain('/dashboard/settings')
            expect(revalidatedPaths).not.toContain('/dashboard')
          }

          // Invoice actions should only affect dashboard
          if (actionType === 'invoice') {
            expect(revalidatedPaths).toContain('/dashboard')
            expect(revalidatedPaths).not.toContain('/dashboard/settings')
          }

          // Store and preferences affect both pages
          if (actionType === 'store' || actionType === 'preferences') {
            expect(revalidatedPaths).toContain('/dashboard')
            expect(revalidatedPaths).toContain('/dashboard/settings')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use correct path format /dashboard/settings instead of /account', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'updatePreferences',
          'updateStore',
          'createContact',
          'updateContact',
          'deleteContact',
          'setPrimaryContact'
        ),
        async (actionName) => {
          revalidatePathCalls.length = 0
          vi.mocked(revalidatePath).mockClear()

          // Call actions that should revalidate settings page
          switch (actionName) {
            case 'updatePreferences':
              await updatePreferencesAction({ export_quality_kb: 100 })
              break
            case 'updateStore':
              await updateStoreAction({ name: 'Test' })
              break
            case 'createContact':
              await createContactAction({ name: 'Test', title: 'Manager' })
              break
            case 'updateContact':
              await updateContactAction('contact-1', { name: 'Updated' })
              break
            case 'deleteContact':
              await deleteContactAction('contact-1')
              break
            case 'setPrimaryContact':
              await setPrimaryContactAction('store-1', 'contact-1')
              break
          }

          const revalidatedPaths = vi.mocked(revalidatePath).mock.calls.map(call => call[0])

          // Should use /dashboard/settings, not /account
          expect(revalidatedPaths).not.toContain('/account')
          
          // Should contain the correct path
          expect(revalidatedPaths).toContain('/dashboard/settings')
        }
      ),
      { numRuns: 100 }
    )
  })
})
