'use server'

import { createClient } from '@/lib/supabase/server'
import { UserPreferencesService } from '@/lib/db/services/user-preferences.service'
import { revalidatePath } from 'next/cache'
import type { InvoiceTemplateId } from '@/components/features/invoice/templates'

export async function getPreferencesAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const service = new UserPreferencesService(supabase)
    const result = await service.getUserPreferences()

    if (result.error) {
      return { success: false, error: result.error.message, data: null }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get preferences error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

export async function updatePreferencesAction(updates: {
  export_quality_kb?: 50 | 100 | 150
  tax_enabled?: boolean
  tax_percentage?: number | null
  selected_template?: InvoiceTemplateId
  preferred_language?: string
  timezone?: string
  date_format?: string
  currency?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new UserPreferencesService(supabase)
    const result = await service.updatePreferences(updates)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Preferences affect account page settings and dashboard invoice display
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Update preferences error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function updateExportQualityAction(quality: 50 | 100 | 150) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new UserPreferencesService(supabase)
    const result = await service.updateExportQuality(quality)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Export quality affects account settings and dashboard invoice export
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Update export quality error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function updateTaxSettingsAction(
  enabled: boolean,
  percentage?: number
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new UserPreferencesService(supabase)
    const result = await service.updateTaxSettings(enabled, percentage)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Tax settings affect account settings and dashboard invoice calculations
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Update tax settings error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function updateSelectedTemplateAction(template: InvoiceTemplateId) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = new UserPreferencesService(supabase)
    const result = await service.updateSelectedTemplate(template)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Template selection affects account settings and dashboard invoice display
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard')
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Update selected template error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
