import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/db/services/subscription.service'

/**
 * Server-only data access layer for subscriptions
 * Uses React cache() for request memoization
 */

export const getSubscriptionStatus = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new SubscriptionService(supabase)
  return await service.getSubscriptionStatus(userId)
})

export const canGenerateInvoice = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new SubscriptionService(supabase)
  return await service.canGenerateInvoice(userId)
})

export const getRemainingInvoices = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new SubscriptionService(supabase)
  return await service.getRemainingInvoices(userId)
})
