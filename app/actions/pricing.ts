'use server'

import { createClient } from '@/lib/supabase/server'

export interface PricingPlan {
  id: string
  tier: string
  name: string
  description: string
  price: number
  billing_period: string
  invoice_limit: number
  features: string[]
  is_active: boolean
  is_popular: boolean
  sort_order: number
  duration: number
  template_count: number
  has_logo: boolean
  has_signature: boolean
  has_custom_colors: boolean
  history_limit: number
  history_type: string
  has_dashboard_totals: boolean
  export_qualities: string[]
  has_monthly_report: boolean
}

export async function getPricingPlansAction(): Promise<{
  success: boolean
  data?: PricingPlan[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Try with RLS bypass for service role
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Error fetching pricing plans:', error)
      return { success: false, error: error.message }
    }

    // Return all plans including inactive ones for display purposes
    return { success: true, data: plans || [] }
  } catch (error) {
    console.error('Error in getPricingPlansAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

