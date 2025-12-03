import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { StoresService } from '@/lib/db/services/stores.service'
import { StoreContactsService } from '@/lib/db/services/store-contacts.service'
import { SubscriptionService } from '@/lib/db/services/subscription.service'
import { UserPreferencesService } from '@/lib/db/services/user-preferences.service'
import { TierService } from '@/lib/db/services/tier.service'
import type { StoreContact } from '@/lib/db/database.types'

/**
 * Server-only data access layer for settings page
 * Uses unstable_cache with revalidateTag for proper server-side caching
 * Cache is invalidated via revalidateTag when mutations occur
 * 
 * IMPORTANT: Since services use cookies() internally via createClient(),
 * we cannot use unstable_cache directly with the fetch functions.
 * Instead, we fetch data normally and rely on Next.js Data Cache + revalidateTag
 * for cache invalidation on mutations.
 */

// Cache tags for settings-related data
export const SETTINGS_CACHE_TAGS = {
  store: 'settings-store',
  contacts: 'settings-contacts',
  subscription: 'settings-subscription',
  preferences: 'settings-preferences',
} as const

export interface SettingsPageStore {
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

export interface SettingsPageSubscription {
  tier: string
  invoiceLimit: number
  remainingInvoices: number
  currentMonthCount: number
  monthYear: string
  resetDate: Date
}

export interface SettingsPagePreferences {
  selected_template?: string | null
  tax_enabled: boolean
  tax_percentage?: number | null
  export_quality_kb: number
}

export interface SettingsPageData {
  store: SettingsPageStore | null
  contacts: StoreContact[]
  subscription: SettingsPageSubscription | null
  preferences: SettingsPagePreferences | null
  isPremium: boolean
}

/**
 * Fetch settings data directly from database
 * This function handles all the data fetching logic
 */
async function fetchSettingsData(userId: string): Promise<SettingsPageData> {
  const supabase = await createClient()

  // Initialize services
  const storesService = new StoresService(supabase)
  const contactsService = new StoreContactsService(supabase)
  const subscriptionService = new SubscriptionService(supabase)
  const preferencesService = new UserPreferencesService(supabase)
  const tierService = new TierService(supabase)

  // Fetch all data in parallel for optimal performance
  const [storeResult, subscriptionResult, preferencesResult, premiumResult] = await Promise.all([
    storesService.getDefaultStore(),
    subscriptionService.getSubscriptionStatus(userId),
    preferencesService.getUserPreferences(),
    tierService.isPremium(userId)
  ])

  const isPremium = premiumResult.data ?? false

  // Extract store data
  // Logo is only included if user is premium (Requirements 4.4)
  // The logo data is retained in the database for re-subscription
  const store = storeResult.data ? {
    id: storeResult.data.id,
    name: storeResult.data.name,
    logo: isPremium ? storeResult.data.logo : null,
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
    preferences,
    isPremium
  }
}

/**
 * Get settings page data with caching
 * 
 * Note: Due to Next.js 15 restrictions, we cannot use unstable_cache
 * with functions that call cookies() internally. Instead, we rely on:
 * 1. Next.js fetch cache for Supabase requests
 * 2. revalidateTag for cache invalidation on mutations
 * 
 * The SETTINGS_CACHE_TAGS are still used by server actions to invalidate
 * the cache when mutations occur.
 * 
 * @param userId - The user ID to fetch settings for
 * @returns Promise<SettingsPageData> - The settings page data
 */
export const getSettingsPageData = async (userId: string): Promise<SettingsPageData> => {
  return fetchSettingsData(userId)
}

/**
 * Get settings page data for the current authenticated user
 * Used by the settings page server component
 */
export const getSettingsPageDataForUser = async (): Promise<SettingsPageData> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      store: null,
      contacts: [],
      subscription: null,
      preferences: null,
      isPremium: false
    }
  }

  return getSettingsPageData(user.id)
}
