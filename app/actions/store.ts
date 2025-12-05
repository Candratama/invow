'use server'

import { createClient } from '@/lib/supabase/server'
import { StoresService, StoreContactsService } from '@/lib/db/services'
import { revalidatePath, revalidateTag } from 'next/cache'
import { SETTINGS_CACHE_TAGS } from '@/lib/db/data-access/settings'
import type { StoreContact } from '@/lib/db/database.types'

export async function updateStoreAction(data: {
  name?: string
  brandColor?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  address?: string
  whatsapp?: string
  email?: string
  phone?: string
  website?: string
  logo?: string
  storeDescription?: string
  tagline?: string
  storeNumber?: string
  paymentMethod?: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const storesService = new StoresService(supabase)
  
  // Get user's default store
  const { data: store } = await storesService.getDefaultStore()
  
  // If no store exists, create one
  if (!store) {
    // Validate required fields for creating a new store
    if (!data.name || !data.address || !data.whatsapp) {
      return { 
        success: false, 
        error: 'Store name, address, and WhatsApp number are required to create a store' 
      }
    }

    // Generate store code from name
    const storeCode = data.name
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .substring(0, 6)
      .padEnd(2, 'S')

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'store'

    const createResult = await storesService.createStore({
      name: data.name,
      slug: slug,
      address: data.address,
      whatsapp: data.whatsapp,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      logo: data.logo || null,
      store_description: data.storeDescription || null,
      tagline: data.tagline || null,
      store_number: data.storeNumber || null,
      payment_method: data.paymentMethod || null,
      brand_color: data.brandColor || '#FFB300',
      is_active: true,
      invoice_prefix: 'INV',
      invoice_number_format: null,
      reset_counter_daily: false,
      store_code: storeCode,
    })

    if (createResult.error) {
      return { success: false, error: createResult.error.message }
    }

    // Invalidate settings cache and revalidate paths
    revalidateTag(SETTINGS_CACHE_TAGS.store, 'max')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { success: true, data: createResult.data }
  }

  // Update existing store - transform camelCase to snake_case
  const updateData: Record<string, string | undefined> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.address !== undefined) updateData.address = data.address
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.email !== undefined) updateData.email = data.email
  if (data.website !== undefined) updateData.website = data.website
  if (data.logo !== undefined) updateData.logo = data.logo
  if (data.storeDescription !== undefined) updateData.store_description = data.storeDescription
  if (data.tagline !== undefined) updateData.tagline = data.tagline
  if (data.storeNumber !== undefined) updateData.store_number = data.storeNumber
  if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod
  if (data.brandColor !== undefined) updateData.brand_color = data.brandColor
  if (data.primaryColor !== undefined) updateData.primary_color = data.primaryColor
  if (data.secondaryColor !== undefined) updateData.secondary_color = data.secondaryColor
  if (data.accentColor !== undefined) updateData.accent_color = data.accentColor

  const result = await storesService.updateStore(store.id, updateData)

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  // Invalidate settings cache and revalidate paths
  revalidateTag(SETTINGS_CACHE_TAGS.store, 'max')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true, data: result.data }
}

export async function createContactAction(contactData: {
  name: string
  title?: string
  signature?: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const storesService = new StoresService(supabase)
  const storeContactsService = new StoreContactsService(supabase)

  // Get store first
  const { data: store } = await storesService.getDefaultStore()
  if (!store) {
    return { success: false, error: 'Store not found' }
  }

  const result = await storeContactsService.createContact({
    store_id: store.id,
    ...contactData,
  })

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  // Invalidate contacts cache and revalidate paths
  revalidateTag(SETTINGS_CACHE_TAGS.contacts, 'max')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard') // Also revalidate dashboard for invoice signature
  return { success: true, data: result.data }
}

export async function updateContactAction(id: string, contactData: {
  name?: string
  title?: string
  signature?: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const storeContactsService = new StoreContactsService(supabase)
  const result = await storeContactsService.updateContact(id, contactData)

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  // Invalidate contacts cache and revalidate paths
  revalidateTag(SETTINGS_CACHE_TAGS.contacts, 'max')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard') // Also revalidate dashboard for invoice signature
  return { success: true, data: result.data }
}

export async function deleteContactAction(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const storeContactsService = new StoreContactsService(supabase)
  const result = await storeContactsService.deleteContact(id)

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  // Invalidate contacts cache and revalidate paths
  revalidateTag(SETTINGS_CACHE_TAGS.contacts, 'max')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard') // Also revalidate dashboard for invoice signature
  return { success: true }
}

export async function setPrimaryContactAction(storeId: string, contactId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const storeContactsService = new StoreContactsService(supabase)
  const result = await storeContactsService.setPrimaryContact(storeId, contactId)

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  // Invalidate contacts cache and revalidate paths
  revalidateTag(SETTINGS_CACHE_TAGS.contacts, 'max')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard') // Also revalidate dashboard for invoice signature
  return { success: true }
}

export async function getStoreAndContactsAction() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const storesService = new StoresService(supabase)
  const storeContactsService = new StoreContactsService(supabase)

  // Get store
  const { data: store } = await storesService.getDefaultStore()
  
  // Get contacts if store exists
  let contacts: StoreContact[] = []
  if (store) {
    const { data: contactsData } = await storeContactsService.getContacts(store.id)
    contacts = contactsData || []
  }

  return { 
    success: true, 
    data: { 
      store, 
      contacts 
    } 
  }
}

/**
 * Invalidate store and contacts cache
 * Use this after direct database updates to refresh cached data
 */
export async function invalidateStoreCache() {
  // Invalidate both store and contacts cache
  revalidateTag(SETTINGS_CACHE_TAGS.store, 'max')
  revalidateTag(SETTINGS_CACHE_TAGS.contacts, 'max')
  
  // Revalidate relevant paths
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  
  return { success: true }
}
