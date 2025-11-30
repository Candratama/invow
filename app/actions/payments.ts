'use server'

import { createClient } from '@/lib/supabase/server'
import { MayarPaymentService } from '@/lib/db/services/mayar-payment.service'
import { revalidatePath } from 'next/cache'

interface PaymentInvoiceResult {
  success: boolean
  data?: {
    invoiceId: string
    paymentUrl: string
    amount: number
    tier: string
  }
  error?: string
}

/**
 * Server Action to create a payment invoice for subscription upgrade
 * 
 * @param tier - Subscription tier ('premium')
 * @returns PaymentInvoiceResult with success status and data or error
 */
export async function createPaymentInvoiceAction(
  tier: 'premium'
): Promise<PaymentInvoiceResult> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized - Please log in to continue' }
    }

    // 2. Validate tier parameter
    const validTiers = ['premium']
    if (!tier || !validTiers.includes(tier)) {
      return { success: false, error: `Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}` }
    }

    // 3. Create payment invoice using MayarPaymentService
    const mayarService = new MayarPaymentService(supabase)
    const { data, error } = await mayarService.createInvoice(user.id, tier)

    if (error) {
      console.error('Failed to create Mayar invoice:', error)

      // Check if it's a configuration error
      if (error.message.includes('not configured')) {
        return { success: false, error: 'Payment service is not configured. Please contact support.' }
      }

      // Check if it's a Mayar API error
      if (error.message.includes('Mayar API error')) {
        return { success: false, error: 'Payment service is temporarily unavailable. Please try again later.' }
      }

      // Generic error
      return { success: false, error: 'Failed to create payment invoice. Please try again.' }
    }

    if (!data) {
      return { success: false, error: 'Failed to create payment invoice' }
    }

    // 4. Revalidate subscription-related paths for cache invalidation
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/account')

    // 5. Return success response with payment details
    return {
      success: true,
      data: {
        invoiceId: data.invoiceId,
        paymentUrl: data.paymentUrl,
        amount: data.amount,
        tier
      }
    }
  } catch (error) {
    console.error('Unexpected error in createPaymentInvoiceAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
