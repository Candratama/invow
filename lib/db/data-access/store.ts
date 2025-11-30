import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { StoresService } from '@/lib/db/services/stores.service'
import { StoreContactsService } from '@/lib/db/services/store-contacts.service'
import { TierService } from '@/lib/db/services/tier.service'

/**
 * Server-only data access layer for stores
 * Uses React cache() for request memoization
 */

export const getStoreByUserId = cache(async () => {
  const supabase = await createClient()
  const service = new StoresService(supabase)
  return await service.getDefaultStore()
})

/**
 * Get store settings with tier-based feature gating
 * Logo is only included if user is premium (Requirements 4.4)
 * Signature is only included if user is premium (Requirements 5.4)
 * The logo and signature data are retained in the database for re-subscription
 */
export const getStoreSettings = cache(async (userId: string) => {
  const supabase = await createClient()
  const storesService = new StoresService(supabase)
  const tierService = new TierService(supabase)
  
  const [storeResult, premiumResult] = await Promise.all([
    storesService.getDefaultStore(),
    tierService.isPremium(userId)
  ])
  
  const isPremium = premiumResult.data ?? false
  
  // If no store data, return as-is
  if (!storeResult.data) {
    return storeResult
  }
  
  // Apply tier-based feature gating
  // Logo and signature are hidden for non-premium users but retained in database
  // This allows re-subscription to restore these features without data loss
  
  // Filter signatures from contacts for non-premium users
  const filteredContacts = storeResult.data.store_contacts?.map(contact => ({
    ...contact,
    signature: isPremium ? contact.signature : null
  }))
  
  return {
    data: {
      ...storeResult.data,
      logo: isPremium ? storeResult.data.logo : null,
      store_contacts: filteredContacts
    },
    error: storeResult.error
  }
})

export const getStoreContacts = cache(async (storeId: string) => {
  const supabase = await createClient()
  const service = new StoreContactsService(supabase)
  return await service.getContacts(storeId)
})
