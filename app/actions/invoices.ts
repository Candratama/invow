'use server'

import { createClient } from '@/lib/supabase/server'
import { InvoicesService } from '@/lib/db/services/invoices.service'
import { revalidatePath } from 'next/cache'
import type { InvoiceInsert, InvoiceUpdate, InvoiceItemInsert } from '@/lib/db/database.types'

export async function createInvoiceAction(
  invoice: Omit<InvoiceInsert, 'user_id'>,
  items: Omit<InvoiceItemInsert, 'invoice_id'>[]
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new InvoicesService(supabase)
    
    // Create invoice first
    const invoiceResult = await service.createInvoice(invoice)

    if (invoiceResult.error || !invoiceResult.data) {
      return { success: false, error: invoiceResult.error?.message || 'Failed to create invoice' }
    }

    // If there are items, insert them
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map((item, index) => ({
        ...item,
        invoice_id: invoiceResult.data!.id,
        position: item.position ?? index,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId)

      if (itemsError) {
        // Rollback: delete the invoice if items failed
        await service.deleteInvoice(invoiceResult.data.id)
        return { success: false, error: `Failed to create invoice items: ${itemsError.message}` }
      }
    }

    // Invoice creation only affects dashboard invoice list
    revalidatePath('/dashboard')
    
    return { success: true, data: invoiceResult.data }
  } catch (error) {
    console.error('Create invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  invoice: InvoiceUpdate,
  items?: Omit<InvoiceItemInsert, 'invoice_id'>[]
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new InvoicesService(supabase)
    
    // If items are provided, update invoice with items
    if (items !== undefined) {
      const result = await service.updateInvoiceWithItems(invoiceId, invoice, items)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      // Invoice update only affects dashboard invoice list
      revalidatePath('/dashboard')
      
      return { success: true, data: result.data }
    }

    // Otherwise, just update the invoice
    const result = await service.updateInvoice(invoiceId, invoice)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Invoice update only affects dashboard invoice list
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Update invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new InvoicesService(supabase)
    const result = await service.deleteInvoice(invoiceId)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Invoice deletion only affects dashboard invoice list
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Delete invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function upsertInvoiceWithItemsAction(
  invoice: Omit<InvoiceInsert, 'user_id'>,
  items: Omit<InvoiceItemInsert, 'invoice_id'>[]
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new InvoicesService(supabase)
    const result = await service.upsertInvoiceWithItems(invoice, items)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Invoice upsert only affects dashboard invoice list
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Upsert invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getNextInvoiceSequenceAction(storeId: string, invoiceDate: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const service = new InvoicesService(supabase)
    const result = await service.getNextInvoiceSequence(storeId, invoiceDate)

    if (result.error) {
      return { success: false, error: result.error.message, data: null }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get next invoice sequence error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

/**
 * Get a single invoice by ID with its items
 * Used by Zustand store to load completed invoices without direct service imports
 * 
 * @param invoiceId - The invoice ID to fetch
 * @returns Invoice with items or error
 */
export async function getInvoiceByIdAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const service = new InvoicesService(supabase)
    const result = await service.getInvoiceWithItems(invoiceId)

    if (result.error) {
      return { success: false, error: result.error.message, data: null }
    }

    if (!result.data) {
      return { success: false, error: 'Invoice not found', data: null }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get invoice by ID error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}
