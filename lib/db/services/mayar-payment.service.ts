/**
 * Mayar Payment Service
 * Handles payment processing and webhook verification with Mayar payment gateway
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

interface CreateInvoiceResponse {
  invoiceId: string;
  paymentUrl: string;
  amount: number;
}

const MAYAR_API_URL = process.env.MAYAR_API_URL || "https://api.mayar.id";
const MAYAR_API_KEY = process.env.MAYAR_API_KEY;
const MAYAR_WEBHOOK_SECRET = process.env.MAYAR_WEBHOOK_SECRET;

import { TIER_PRICES } from "@/lib/config/pricing";

const TIER_AMOUNTS: Record<string, number> = TIER_PRICES;

export class MayarPaymentService {
  private supabase: SupabaseClient;
  private maxRetries = 3;
  private retryDelayMs = 1000;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Create an invoice in Mayar for payment
   * @param userId - User ID
   * @param tier - Subscription tier ('starter' or 'pro')
   * @returns Invoice ID and payment URL
   */
  async createInvoice(
    userId: string,
    tier: string,
  ): Promise<{
    data: CreateInvoiceResponse | null;
    error: Error | null;
  }> {
    try {
      if (!MAYAR_API_KEY) {
        throw new Error("MAYAR_API_KEY is not configured");
      }

      const amount = TIER_AMOUNTS[tier];
      if (!amount) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      // Get user info for invoice
      const { data: userData } = await this.supabase.auth.getUser();
      const userEmail = userData?.user?.email || 'noreply@example.com';
      const userName = userEmail.split('@')[0] || 'Customer';
      
      // Set expiration date (30 days from now)
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 30);
      
      // Call Mayar API to create invoice
      const response = await this.callMayarAPI("/invoice/create", "POST", {
        name: userName,
        mobile: '081234567890', // Default mobile, can be updated later
        email: userEmail,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Subscription - 30 Days`,
        expiredAt: expiredAt.toISOString(),
        items: [
          {
            rate: amount,
            description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Subscription - 30 Days`,
            quantity: 1,
          },
        ],
      });

      // Mayar API returns data in a nested structure
      const responseData = response.data as Record<string, unknown>;
      
      // IMPORTANT: Mayar returns TWO IDs:
      // - id: Product ID (used for product management)
      // - transactionId: Transaction ID (used for payment tracking)
      // We MUST use transactionId because webhook sends id = transactionId
      const transactionId = responseData?.transactionId as string;
      const paymentUrl = responseData?.link as string;

      if (!transactionId || !paymentUrl) {
        throw new Error("Invalid response from Mayar API - missing transactionId or link");
      }
      
      // Invoice created (IDs logged only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log("Invoice created:", transactionId?.substring(0, 8) + "...");
      }

      // Create payment transaction record in Supabase
      // Use transactionId because webhook will send id = transactionId
      const { error: dbError } = await this.supabase
        .from("payment_transactions")
        .insert({
          user_id: userId,
          mayar_invoice_id: transactionId,
          amount,
          tier,
          status: "pending",
        });

      if (dbError) {
        throw new Error(`Failed to create payment record: ${dbError.message}`);
      }

      return {
        data: {
          invoiceId: transactionId,
          paymentUrl,
          amount,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Verify webhook signature from Mayar
   * @param payload - Webhook payload
   * @param signature - Signature from Mayar
   * @returns True if signature is valid
   */
  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    try {
      if (!MAYAR_WEBHOOK_SECRET) {
        console.error("MAYAR_WEBHOOK_SECRET is not configured");
        return false;
      }

      // Convert payload to JSON string for signature verification
      const payloadString =
        typeof payload === "string" ? payload : JSON.stringify(payload);

      // Create HMAC SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", MAYAR_WEBHOOK_SECRET)
        .update(payloadString)
        .digest("hex");

      // Compare signatures (constant-time comparison to prevent timing attacks)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Handle successful payment
   * @param mayarInvoiceId - Mayar invoice ID (can be transaction ID or product ID)
   * @param alternativeId - Alternative ID to try if first one fails
   * @param paymentMethod - Payment method used (e.g., "QRIS", "Bank Transfer")
   * @returns Success status
   */
  async handlePaymentSuccess(
    mayarInvoiceId: string,
    alternativeId?: string,
    paymentMethod?: string
  ): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // Try to get payment transaction with primary ID
      let { data: transaction, error: fetchError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("mayar_invoice_id", mayarInvoiceId)
        .maybeSingle();

      // If not found and we have alternative ID, try that
      if (!transaction && alternativeId) {
        // Trying alternative ID (no sensitive data logged)
        const result = await this.supabase
          .from("payment_transactions")
          .select("*")
          .eq("mayar_invoice_id", alternativeId)
          .maybeSingle();
        
        transaction = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        throw new Error(
          `Payment transaction not found: ${fetchError.message}`,
        );
      }

      if (!transaction) {
        throw new Error(`Payment transaction not found with ID: ${mayarInvoiceId}${alternativeId ? ` or ${alternativeId}` : ''}`);
      }
      
      // Payment transaction found (no sensitive data logged)

      // Update payment transaction status
      const updateData: {
        status: string;
        completed_at: string;
        webhook_verified_at: string;
        payment_method?: string;
      } = {
        status: "completed",
        completed_at: new Date().toISOString(),
        webhook_verified_at: new Date().toISOString(),
      };

      // Add payment method if provided
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      const { error: updateError } = await this.supabase
        .from("payment_transactions")
        .update(updateData)
        .eq("id", transaction.id);

      if (updateError) {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }

      // Upgrade user subscription
      const { SubscriptionService } = await import("./subscription.service");
      const subscriptionService = new SubscriptionService(this.supabase);
      const { error: upgradeError } = await subscriptionService.upgradeToTier(
        transaction.user_id,
        transaction.tier,
      );

      if (upgradeError) {
        throw new Error(`Failed to upgrade subscription: ${upgradeError.message}`);
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Handle failed payment
   * @param mayarInvoiceId - Mayar invoice ID
   * @returns Success status
   */
  async handlePaymentFailed(mayarInvoiceId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // Get payment transaction
      const { data: transaction, error: fetchError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("mayar_invoice_id", mayarInvoiceId)
        .single();

      if (fetchError) {
        throw new Error(
          `Payment transaction not found: ${fetchError.message}`,
        );
      }

      if (!transaction) {
        throw new Error("Payment transaction not found");
      }

      // Update payment transaction status
      const { error: updateError } = await this.supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          webhook_verified_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateError) {
        throw new Error(`Failed to update payment status: ${updateError.message}`);
      }

      // Log failure
      console.error(
        `Payment failed for invoice ${mayarInvoiceId}, user ${transaction.user_id}`,
      );

      return { success: true, error: null };
    } catch (error) {
      console.error("Error handling payment failure:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Call Mayar API with retry logic
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param body - Request body
   * @returns API response
   */
  private async callMayarAPI(
    endpoint: string,
    method: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const url = `${MAYAR_API_URL}${endpoint}`;

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MAYAR_API_KEY}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Mayar API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes("400")) {
          throw error;
        }

        // Retry on server errors (5xx) or network errors
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelayMs * (attempt + 1)),
          );
        }
      }
    }

    throw lastError || new Error("Failed to call Mayar API after retries");
  }
}

// Export singleton instance
export const mayarPaymentService = new MayarPaymentService();
