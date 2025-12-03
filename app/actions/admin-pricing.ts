'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/db/services/admin.service'
import {
  getSubscriptionPlans,
  SUBSCRIPTION_PLANS_CACHE_TAGS,
  type SubscriptionPlan,
  type SubscriptionPlanInput,
} from '@/lib/db/data-access/subscription-plans'

async function verifyAdminAccess(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const adminStatus = await isAdmin(user.id)
  return adminStatus ? user.id : null
}

export async function getSubscriptionPlansAction(includeInactive = false): Promise<{
  success: boolean
  data?: SubscriptionPlan[]
  error?: string
}> {
  try {
    console.log('[getSubscriptionPlansAction] Fetching plans, includeInactive:', includeInactive)
    const result = await getSubscriptionPlans(includeInactive)
    console.log('[getSubscriptionPlansAction] Result:', { 
      hasData: !!result.data, 
      dataLength: result.data?.length,
      error: result.error?.message 
    })
    if (result.error) {
      return { success: false, error: result.error.message }
    }
    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('[getSubscriptionPlansAction] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateSubscriptionPlanAction(
  planId: string,
  data: Partial<SubscriptionPlanInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminId = await verifyAdminAccess()
    if (!adminId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = data.price
    if (data.invoiceLimit !== undefined) updateData.invoice_limit = data.invoiceLimit
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.features !== undefined) updateData.features = data.features
    if (data.templateCount !== undefined) updateData.template_count = data.templateCount
    if (data.hasLogo !== undefined) updateData.has_logo = data.hasLogo
    if (data.hasSignature !== undefined) updateData.has_signature = data.hasSignature
    if (data.hasCustomColors !== undefined) updateData.has_custom_colors = data.hasCustomColors
    if (data.historyLimit !== undefined) updateData.history_limit = data.historyLimit
    if (data.historyType !== undefined) updateData.history_type = data.historyType
    if (data.hasDashboardTotals !== undefined) updateData.has_dashboard_totals = data.hasDashboardTotals
    if (data.exportQualities !== undefined) updateData.export_qualities = data.exportQualities
    if (data.hasMonthlyReport !== undefined) updateData.has_monthly_report = data.hasMonthlyReport
    if (data.isActive !== undefined) updateData.is_active = data.isActive
    if (data.isPopular !== undefined) updateData.is_popular = data.isPopular

    const { error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', planId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateTag(SUBSCRIPTION_PLANS_CACHE_TAGS.plans)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
