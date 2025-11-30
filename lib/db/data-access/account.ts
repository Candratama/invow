import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { StoresService } from '@/lib/db/services/stores.service'
import { StoreContactsService } from '@/lib/db/services/store-contacts.service'
import { SubscriptionService } from '@/lib/db/services/subscription.service'
import { UserPreferencesService } from '@/lib/db/services/user-preferences.service'
import type { StoreContact } from '@/lib/db/database.types'

/**
 * Server-only data access layer for account page
 * Uses React cache() for request memoization
 * Fetches all account-related data in parallel for optimal performance
 */

export interface AccountPageStore {
  id: string
  name?: string | null
  logo?: string | null
  address?: string | null
  whatsapp?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  store_description?: string | null
  tagline?: string | null
  store_number?: string | null
  brand_color?: string | null
  payment_method?: string | null
}

export interface AccountPageSubscription {
  tier: string
  invoiceLimit: number
  remainingInvoices: number
  currentMonthCount: number
  monthYear: string
  resetDate: Date
}

export interface AccountPagePreferences {
  selected_template?: string | null
  tax_enabled: boolean
  tax_percentage?: number | null
  export_quality_kb: number
}

export interface AccountPageData {
  store: AccountPageStore | null
  contacts: StoreContact[]
  subscription: AccountPageSubscription | null
  preferences: AccountPagePreferences | null
}

export const getAccountPageData = cache(async (): Promise<AccountPageData> => {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      store: null,
      contacts: [],
      subscription: null,
      preferences: null
    }
  }

  // Initialize services
  const storesService = new StoresService(supabase)
  const contactsService = new StoreContactsService(supabase)
  const subscriptionService = new SubscriptionService(supabase)
  const preferencesService = new UserPreferencesService(supabase)

  // Fetch all data in parallel for optimal performance
  const [storeResult, subscriptionResult, preferencesResult] = await Promise.all([
    storesService.getDefaultStore(),
    subscriptionService.getSubscriptionStatus(user.id),
    preferencesService.getUserPreferences()
  ])

  // Extract store data
  const store = storeResult.data ? {
    id: storeResult.data.id,
    name: storeResult.data.name,
    logo: storeResult.data.logo,
    address: storeResult.data.address,
    whatsapp: storeResult.data.whatsapp,
    phone: storeResult.data.phone,
    email: storeResult.data.email,
    website: storeResult.data.website,
    store_description: storeResult.data.store_description,
    tagline: storeResult.data.tagline,
    store_number: storeResult.data.store_number,
    brand_color: storeResult.data.brand_color,
    payment_method: storeResult.data.payment_method
  } : null

  // Fetch contacts only if store exists
  let contacts: StoreContact[] = []
  if (store?.id) {
    const contactsResult = await contactsService.getContacts(store.id)
    contacts = contactsResult.data || []
  }

  // Extract preferences data
  const preferences = preferencesResult.data ? {
    selected_template: preferencesResult.data.selected_template,
    tax_enabled: preferencesResult.data.tax_enabled,
    tax_percentage: preferencesResult.data.tax_percentage,
    export_quality_kb: preferencesResult.data.export_quality_kb
  } : null

  return {
    store,
    contacts,
    subscription: subscriptionResult.data,
    preferences
  }
})
