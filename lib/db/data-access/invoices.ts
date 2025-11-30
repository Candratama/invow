import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { InvoicesService } from '@/lib/db/services/invoices.service'

/**
 * Server-only data access layer for invoices
 * Uses React cache() for request memoization
 */

export const getInvoicesByUserId = cache(async (userId: string, status?: "draft" | "pending" | "synced", limit?: number) => {
  const supabase = await createClient()
  const service = new InvoicesService(supabase)
  return await service.getInvoices(status, limit)
})

export const getInvoicesPaginated = cache(async (page: number = 1, pageSize: number = 10, status?: "draft" | "pending" | "synced") => {
  const supabase = await createClient()
  const service = new InvoicesService(supabase)
  return await service.getInvoicesPaginated(page, pageSize, status)
})

export const getAllInvoices = cache(async (status?: "draft" | "pending" | "synced") => {
  const supabase = await createClient()
  const service = new InvoicesService(supabase)
  return await service.getInvoices(status)
})

export const getInvoiceById = cache(async (invoiceId: string) => {
  const supabase = await createClient()
  const service = new InvoicesService(supabase)
  return await service.getInvoiceWithItems(invoiceId)
})
