'use server'

import { getCurrentUserId } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/db/services/subscription.service'
import { TierService } from '@/lib/db/services/tier.service'
import { MonthlyReportService } from '@/lib/db/services/monthly-report.service'
import { revalidatePath } from 'next/cache'

export async function upgradeSubscriptionAction(tier: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new SubscriptionService(supabase)
  const result = await service.upgradeToTier(userId, tier)

  if (result.success) {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
  }

  return result
}

export async function getSubscriptionStatusAction() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new SubscriptionService(supabase)
  return await service.getSubscriptionStatus(userId)
}

export async function isPremiumAction() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: false, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.isPremium(userId)
}

export async function getAvailableReportMonthsAction() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new MonthlyReportService(supabase)
  return await service.getAvailableReportMonths(userId)
}

export async function getMonthlyReportAction(monthYear?: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new MonthlyReportService(supabase)
  return await service.generateMonthlyReport(userId, monthYear)
}

export async function getMonthlyReportForPDFAction(monthYear?: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const service = new MonthlyReportService(supabase)
  return await service.generateReportForPDF(userId, monthYear)
}
