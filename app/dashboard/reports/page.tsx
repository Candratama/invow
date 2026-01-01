import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PremiumUpgradePrompt } from './components/premium-gate'
import ReportsClient from './reports-client'

export const metadata = {
  title: 'Business Reports | Invow',
  description: 'Analyze your business performance with detailed revenue analytics',
}

export default async function ReportsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard/login')
  }

  // Check subscription status
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier, invoice_limit, current_month_count, month_year')
    .eq('user_id', user.id)
    .single()

  // Free tier users can't access reports
  if (!subscription || subscription.tier === 'free') {
    return <PremiumUpgradePrompt />
  }

  // Get default store ID from preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('default_store_id')
    .eq('user_id', user.id)
    .single()

  if (!preferences?.default_store_id) {
    return (
      <div className="p-8">
        <p>Please set up your store in Settings before accessing reports.</p>
      </div>
    )
  }

  return (
    <ReportsClient
      subscriptionStatus={subscription}
      storeId={preferences.default_store_id}
    />
  )
}
