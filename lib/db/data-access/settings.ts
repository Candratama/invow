import { unstable_cache } from 'next/cache'
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
 */

// Cache tags for settings-related data
export const SETTINGS_CACHE_TAGS = {
  store: 'settings-store',
  contacts: 'settings-contacts',
  subscription: 'settings-subscription',
  preferences: 'settings-preferences',
} as const

// Cache revalidation time in seconds
const CACHE_REVALIDATE = 60

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
}

/**
 * Internal function to fetch settings data
 * This is wrapped by unstable_cache for caching
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
    preferences
  }
}

/**
 * Get settings page data with unstable_cache for server-side caching
 * Cache is tagged for granular invalidation via revalidateTag
 * 
 * @param userId - The user ID to fetch settings for
 * @returns Promise<SettingsPageData> - The settings page data
 */
export const getSettingsPageData = async (userId: string): Promise<SettingsPageData> => {
  // Create cached function with user-specific cache key
  const getCachedData = unstable_cache(
    async () => fetchSettingsData(userId),
    [`settings-page-data-${userId}`],
    {
      revalidate: CACHE_REVALIDATE,
      tags: [
        SETTINGS_CACHE_TAGS.store,
        SETTINGS_CACHE_TAGS.contacts,
        SETTINGS_CACHE_TAGS.subscription,
        SETTINGS_CACHE_TAGS.preferences,
      ],
    }
  )

  return getCachedData()
}

/**
 * Get settings page data without authentication check
 * Used when user is already authenticated and userId is known
 */
export const getSettingsPageDataForUser = async (): Promise<SettingsPageData> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      store: null,
      contacts: [],
      subscription: null,
      preferences: null
    }
  }

  return getSettingsPageData(user.id)
}
