'use server'

import { createClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/db/services/subscription.service'
import { revalidatePath } from 'next/cache'

export async function upgradeSubscriptionAction(tier: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const service = new SubscriptionService(supabase)
  const result = await service.upgradeToTier(user.id, tier)

  if (result.success) {
    revalidatePath('/dashboard')
    revalidatePath('/account')
  }

  return result
}

export async function getSubscriptionStatusAction() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' }
  }

  const service = new SubscriptionService(supabase)
  return await service.getSubscriptionStatus(user.id)
}
