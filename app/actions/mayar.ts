'use server';

/**
 * Server actions for Mayar payment integration
 * These actions bridge the application to Mayar MCP tools
 */

import { createClient } from '@/lib/supabase/server';

export interface CreateInvoiceResult {
  success: boolean;
  data?: {
    invoiceId: string;
    paymentUrl: string;
    amount: number;
  };
  error?: string;
}

import { TIER_PRICES } from '@/lib/config/pricing';

const TIER_AMOUNTS: Record<string, number> = TIER_PRICES;

/**
 * Create a Mayar invoice for subscription upgrade
 * NOTE: This is a placeholder - you need to implement the actual Mayar API call
 * once you have the correct endpoint from Mayar documentation
 */
export async function createMayarInvoiceAction(
  tier: string
): Promise<CreateInvoiceResult> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Please log in to continue',
      };
    }

    // 2. Validate tier
    const amount = TIER_AMOUNTS[tier];
    if (!amount) {
      return {
        success: false,
        error: `Invalid tier: ${tier}`,
      };
    }

    // 3. TODO: Call Mayar API to create invoice
    // For now, return an error message with instructions
    return {
      success: false,
      error: 'Mayar API integration incomplete. Please contact support or check Mayar documentation for the correct API endpoint.',
    };

    // When you have the correct endpoint, uncomment and update this:
    /*
    const response = await fetch('CORRECT_MAYAR_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAYAR_API_KEY}`,
      },
      body: JSON.stringify({
        name: userName,
        mobile: '081234567890',
        email: userEmail,
        description: `Upgrade to ${tier} tier subscription`,
        items: [
          {
            rate: amount,
            description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Subscription - Monthly`,
            quantity: 1,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mayar API error: ${response.status}`);
    }

    const data = await response.json();

    // 5. Save to database
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        mayar_invoice_id: data.id,
        amount,
        tier,
        status: 'pending',
      });

    if (dbError) {
      throw new Error(`Failed to create payment record: ${dbError.message}`);
    }

    return {
      success: true,
      data: {
        invoiceId: data.id,
        paymentUrl: data.link,
        amount,
      },
    };
    */
  } catch (error) {
    console.error('Error creating Mayar invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
