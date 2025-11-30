import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { StoresService } from '@/lib/db/services/stores.service'
import { StoreContactsService } from '@/lib/db/services/store-contacts.service'

/**
 * Server-only data access layer for stores
 * Uses React cache() for request memoization
 */

export const getStoreByUserId = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new StoresService(supabase)
  return await service.getDefaultStore()
})

export const getStoreSettings = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new StoresService(supabase)
  return await service.getDefaultStore()
})

export const getStoreContacts = cache(async (storeId: string) => {
  const supabase = await createClient()
  const service = new StoreContactsService(supabase)
  return await service.getContacts(storeId)
})
