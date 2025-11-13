/**
 * Invoice Items Service
 * Handles CRUD operations for invoice_items table
 */

import { createClient } from '@/lib/supabase/client'
import type {
  InvoiceItem,
  InvoiceItemInsert,
  InvoiceItemUpdate,
} from '@/lib/db/database.types'

export class ItemsService {
  private supabase = createClient()

  /**
   * Get all items for a specific invoice
   * @param invoiceId - Invoice ID
   * @returns Array of invoice items
   */
  async getItems(invoiceId: string): Promise<{
    data: InvoiceItem[] | null
    error: Error | null
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', invoiceId)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Invoice does not belong to authenticated user')
      }

      const { data, error } = await this.supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('position', { ascending: true })

      if (error) throw new Error(error.message)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Add a new item to an invoice
   * @param item - Item data to insert
   * @returns Created item
   */
  async addItem(
    item: InvoiceItemInsert
  ): Promise<{
    data: InvoiceItem | null
    error: Error | null
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', item.invoice_id)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Invoice does not belong to authenticated user')
      }

      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert(item)
        .select()
        .single()

      if (error) throw new Error(error.message)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Update an existing item
   * @param itemId - Item ID
   * @param item - Item data to update
   * @returns Updated item
   */
  async updateItem(
    itemId: string,
    item: InvoiceItemUpdate
  ): Promise<{
    data: InvoiceItem | null
    error: Error | null
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify item belongs to user's store
      const { data: itemRecord } = await this.supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('id', itemId)
        .single()

      if (!itemRecord) {
        throw new Error('Item not found')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', itemRecord.invoice_id)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Item does not belong to authenticated user')
      }

      const { data, error } = await this.supabase
        .from('invoice_items')
        .update(item)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Delete an item
   * @param itemId - Item ID
   * @returns Success status
   */
  async deleteItem(itemId: string): Promise<{
    success: boolean
    error: Error | null
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify item belongs to user's store
      const { data: itemRecord } = await this.supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('id', itemId)
        .single()

      if (!itemRecord) {
        throw new Error('Item not found')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', itemRecord.invoice_id)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Item does not belong to authenticated user')
      }

      const { error } = await this.supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId)

      if (error) throw new Error(error.message)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Replace all items for an invoice (delete all and insert new)
   * @param invoiceId - Invoice ID
   * @param items - New items to insert
   * @returns Array of created items
   */
  async replaceItems(
    invoiceId: string,
    items: Omit<InvoiceItemInsert, 'invoice_id'>[]
  ): Promise<{
    data: InvoiceItem[] | null
    error: Error | null
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', invoiceId)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Invoice does not belong to authenticated user')
      }

      // 1. Delete existing items
      const { error: deleteError } = await this.supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      if (deleteError) throw new Error(deleteError.message)

      // 2. Insert new items (if any)
      if (items.length === 0) {
        return { data: [], error: null }
      }

      const itemsWithInvoiceId = items.map((item, index) => ({
        ...item,
        invoice_id: invoiceId,
        position: item.position ?? index,
      }))

      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId)
        .select()
        .order('position', { ascending: true })

      if (error) throw new Error(error.message)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Bulk add items to an invoice
   * @param items - Array of items to insert
   * @returns Array of created items
   */
  async bulkAddItems(
    items: InvoiceItemInsert[]
  ): Promise<{
    data: InvoiceItem[] | null
    error: Error | null
  }> {
    try {
      if (items.length === 0) {
        return { data: [], error: null }
      }

      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify all items belong to invoices in user's store
      // Check first item to get invoice_id, then verify ownership
      const firstInvoiceId = items[0].invoice_id

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', firstInvoiceId)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Items do not belong to authenticated user')
      }

      // Verify all items are for the same invoice
      const allSameInvoice = items.every((item) => item.invoice_id === firstInvoiceId)
      if (!allSameInvoice) {
        throw new Error('All items must belong to the same invoice')
      }

      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert(items)
        .select()

      if (error) throw new Error(error.message)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Update item positions (for reordering)
   * @param updates - Array of {id, position} to update
   * @returns Success status
   */
  async updatePositions(
    updates: { id: string; position: number }[]
  ): Promise<{
    success: boolean
    error: Error | null
  }> {
    try {
      if (updates.length === 0) {
        return { success: true, error: null }
      }

      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get first item to verify ownership
      const { data: firstItem } = await this.supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('id', updates[0].id)
        .single()

      if (!firstItem) {
        throw new Error('Item not found')
      }

      // Verify invoice belongs to user's store
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('store_id')
        .eq('id', firstItem.invoice_id)
        .single()

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from('stores')
        .select('user_id')
        .eq('id', invoice.store_id)
        .single()

      if (!store || store.user_id !== user.id) {
        throw new Error('Unauthorized: Items do not belong to authenticated user')
      }

      // Verify all items are from the same invoice
      const { data: items } = await this.supabase
        .from('invoice_items')
        .select('id, invoice_id')
        .in(
          'id',
          updates.map((u) => u.id)
        )

      if (!items || items.length !== updates.length) {
        throw new Error('Some items not found')
      }

      const allSameInvoice = items.every((item) => item.invoice_id === firstItem.invoice_id)
      if (!allSameInvoice) {
        throw new Error('All items must belong to the same invoice')
      }

      // Update each item's position
      const promises = updates.map((update) =>
        this.supabase
          .from('invoice_items')
          .update({ position: update.position })
          .eq('id', update.id)
      )

      const results = await Promise.all(promises)

      // Check if any failed
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        throw new Error(failed.error.message)
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }
}

// Export singleton instance
export const itemsService = new ItemsService()
