/**
 * Mayar Payment Service
 * Handles payment processing with Mayar payment gateway using redirect-based verification
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { safeLog, maskId } from "@/lib/utils/safe-logger";

interface CreateInvoiceResponse {
  invoiceId: string;
  paymentUrl: string;
  amount: number;
}

const MAYAR_API_URL = process.env.MAYAR_API_URL || "https://api.mayar.id";
const MAYAR_API_KEY = process.env.MAYAR_API_KEY;

import { TIER_PRICES } from "@/lib/config/pricing";

const TIER_AMOUNTS: Record<string, number> = TIER_PRICES;

export class MayarPaymentService {
  private maxRetries = 3;
  private retryDelayMs = 1000;
  
  // Cache for Mayar API responses to avoid duplicate calls
  private static transactionCache = new Map<string, {
    data: unknown[];
    timestamp: number;
  }>();
  
  // Cache TTL: 30 seconds
  private static CACHE_TTL_MS = 30000;
  
  // In-flight requests to prevent duplicate simultaneous calls
  private static inflightRequests = new Map<string, Promise<unknown[]>>();

  constructor(private supabase: SupabaseClient) {}
  
  /**
   * Clear expired cache entries
   */
  private static clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.transactionCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.transactionCache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cache entries (useful for testing or manual refresh)
   */
  public static clearCache() {
    this.transactionCache.clear();
    this.inflightRequests.clear();
    console.log("[Mayar Payment Service] Cache cleared");
  }
  
  /**
   * Get cache statistics (useful for monitoring)
   */
  public static getCacheStats() {
    return {
      cacheSize: this.transactionCache.size,
      inflightRequests: this.inflightRequests.size,
      cacheTTL: this.CACHE_TTL_MS,
    };
  }

  /**
   * Create an invoice in Mayar for payment
   * @param userId - User ID
   * @param tier - Subscription tier ('premium')
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
      
      // Construct redirect URL with payment_redirect parameter
      // Use environment variable for base URL (NEXT_PUBLIC_APP_URL)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Ensure HTTPS protocol in production environment
      let redirectBaseUrl = baseUrl;
      if (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https://')) {
        redirectBaseUrl = baseUrl.replace(/^http:\/\//, 'https://');
      }
      
      safeLog.payment('Creating invoice', { userId, tier });
      
      // IMPORTANT: Create payment record FIRST before calling Mayar API
      // This allows us to use our own payment ID in the redirect URL
      // since Mayar doesn't automatically append transaction parameters
      const { data: paymentRecord, error: dbError } = await this.supabase
        .from("payment_transactions")
        .insert({
          user_id: userId,
          mayar_invoice_id: null, // Will be updated after Mayar API call
          amount,
          tier,
          status: "pending",
        })
        .select()
        .single();

      if (dbError || !paymentRecord) {
        console.error(
          `[Invoice Creation] Failed to create payment record:`,
          dbError?.message
        );
        throw new Error(`Failed to create payment record: ${dbError?.message}`);
      }
      
      safeLog.payment('Payment record created', { paymentId: paymentRecord.id });
      
      // Use our payment record ID in the redirect URL
      // This way we can look up the payment when user returns
      const redirectUrl = `${redirectBaseUrl}/dashboard?payment_redirect=true&payment_id=${paymentRecord.id}`;
      
      // Call Mayar API to create invoice
      const response = await this.callMayarAPI("/invoice/create", "POST", {
        name: userName,
        mobile: '081234567890', // Default mobile, can be updated later
        email: userEmail,
        redirectUrl: redirectUrl,
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
      // We MUST use transactionId because it's used for payment verification
      const transactionId = responseData?.transactionId as string;
      const paymentUrl = responseData?.link as string;

      if (!transactionId || !paymentUrl) {
        throw new Error("Invalid response from Mayar API - missing transactionId or link");
      }
      
      // Log invoice creation with transaction ID
      safeLog.payment('Invoice created successfully', {
        userId,
        invoiceId: transactionId,
        tier,
        amount,
      });

      // Update payment record with Mayar transaction ID
      const { error: updateError } = await this.supabase
        .from("payment_transactions")
        .update({
          mayar_invoice_id: transactionId,
        })
        .eq("id", paymentRecord.id);

      if (updateError) {
        console.error(
          `[Invoice Creation] Failed to update payment record with Mayar invoice ID:`,
          updateError.message
        );
        throw new Error(`Failed to update payment record: ${updateError.message}`);
      }
      
      safeLog.payment('Payment record updated with invoice ID', { invoiceId: transactionId });

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
   * Verify payment with Mayar API and process subscription update using payment record ID
   * This is called after user is redirected from Mayar payment page
   * @param userId - User ID
   * @param paymentRecordId - Our payment record ID from redirect URL
   * @returns Verification result with subscription details
   */
  async verifyAndProcessPaymentByRecordId(
    userId: string,
    paymentRecordId: string,
  ): Promise<{
    data?: {
      subscription: {
        tier: string;
        expiresAt: string;
      };
    };
    error?: Error;
  }> {
    try {
      safeLog.payment('Verification started', { paymentId: paymentRecordId });

      // 1. Find payment record by our payment ID and user ID
      const { data: payment, error: findError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", paymentRecordId)
        .eq("user_id", userId)
        .maybeSingle();

      if (findError) {
        console.error("[Payment Verification] Database error:", findError);
        return { error: new Error("Failed to query payment record") };
      }

      if (!payment) {
        safeLog.error('Payment record not found', { paymentId: maskId(paymentRecordId) });
        return { error: new Error("Payment record not found or access denied") };
      }

      // 2. Check if we have a Mayar invoice ID
      if (!payment.mayar_invoice_id) {
        safeLog.error('Payment record has no Mayar invoice ID');
        return { error: new Error("Payment is not yet initialized. Please try again.") };
      }

      // 3. Use the existing verification method with the Mayar invoice ID
      return await this.verifyAndProcessPayment(userId, payment.mayar_invoice_id);
    } catch (error) {
      console.error("[Payment Verification] Unexpected error:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("An unexpected error occurred"),
      };
    }
  }

  /**
   * Verify payment with Mayar API and process subscription update
   * This is called after user is redirected from Mayar payment page
   * @param userId - User ID
   * @param invoiceId - Mayar invoice ID from redirect URL
   * @returns Verification result with subscription details
   */
  async verifyAndProcessPayment(
    userId: string,
    invoiceId: string,
  ): Promise<{
    data?: {
      subscription: {
        tier: string;
        expiresAt: string;
      };
    };
    error?: Error;
  }> {
    try {
      safeLog.payment('Verification started', { invoiceId });

      // 1. Find payment record in database by invoice ID and user ID
      const { data: payment, error: findError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("mayar_invoice_id", invoiceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (findError) {
        console.error("[Payment Verification] Database error:", findError);
        return { error: new Error("Failed to query payment record") };
      }

      if (!payment) {
        safeLog.error('Payment not found for invoice');
        return { error: new Error("Payment record not found") };
      }

      // 2. Check if payment is already processed (idempotency)
      if (payment.status === "completed") {
        safeLog.info('Payment already processed');

        // Return current subscription details
        const { data: subscription } = await this.supabase
          .from("user_subscriptions")
          .select("tier, subscription_end_date")
          .eq("user_id", userId)
          .single();

        if (subscription) {
          return {
            data: {
              subscription: {
                tier: subscription.tier,
                expiresAt: subscription.subscription_end_date || "",
              },
            },
          };
        }

        return { error: new Error("Subscription not found") };
      }

      // 3. Verify payment status with Mayar API
      safeLog.info('Querying Mayar API for invoice');

      const transactions = await this.getMayarTransactionByInvoiceId(invoiceId);

      if (!transactions || transactions.length === 0) {
        safeLog.error('Transaction not found in Mayar');
        return {
          error: new Error(
            "Transaction not found in Mayar. Please wait a moment and try again.",
          ),
        };
      }

      const transaction = transactions[0] as Record<string, unknown>;

      // 4. Validate payment status is "paid"
      if (transaction.status !== "paid") {
        safeLog.error(`Payment status is ${transaction.status}, not paid`);
        return {
          error: new Error(
            `Payment is ${transaction.status}. Please complete the payment first.`,
          ),
        };
      }

      safeLog.payment('Payment verified as paid', { invoiceId, status: 'paid' });

      // 5. Update payment record with transaction details
      const { error: updateError } = await this.supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          mayar_transaction_id: transaction.paymentLinkTransactionId as string,
          payment_method: transaction.paymentMethod as string,
          completed_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error(
          "[Payment Verification] Failed to update payment record:",
          updateError,
        );
        return {
          error: new Error(
            "Failed to update payment record. Please contact support.",
          ),
        };
      }

      // 6. Upgrade user subscription
      const { SubscriptionService } = await import("./subscription.service");
      const subscriptionService = new SubscriptionService(this.supabase);
      const { success, error: upgradeError } =
        await subscriptionService.upgradeToTier(userId, payment.tier);

      if (upgradeError || !success) {
        console.error(
          "[Payment Verification] Failed to upgrade subscription:",
          upgradeError,
        );
        return {
          error: new Error(
            "Payment verified but subscription upgrade failed. Please contact support.",
          ),
        };
      }

      // 7. Get updated subscription details
      const { data: updatedSubscription } = await this.supabase
        .from("user_subscriptions")
        .select("tier, subscription_end_date")
        .eq("user_id", userId)
        .single();

      if (!updatedSubscription) {
        return { error: new Error("Failed to retrieve updated subscription") };
      }

      safeLog.payment('Verification success', { 
        invoiceId, 
        tier: updatedSubscription.tier,
        status: 'completed'
      });

      return {
        data: {
          subscription: {
            tier: updatedSubscription.tier,
            expiresAt: updatedSubscription.subscription_end_date || "",
          },
        },
      };
    } catch (error) {
      console.error("[Payment Verification] Unexpected error:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("An unexpected error occurred"),
      };
    }
  }

  /**
   * Query Mayar transactions by invoice ID with caching and deduplication
   * Fetches transactions from Mayar API and filters by invoice ID
   * @param invoiceId - Mayar invoice ID to search for
   * @returns Array of matching transactions
   */
  private async getMayarTransactionByInvoiceId(
    invoiceId: string,
  ): Promise<unknown[]> {
    // Clear expired cache entries
    MayarPaymentService.clearExpiredCache();
    
    // Check cache first
    const cacheKey = `transactions_${invoiceId}`;
    const cached = MayarPaymentService.transactionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MayarPaymentService.CACHE_TTL_MS) {
      safeLog.info('Using cached transaction result');
      return cached.data;
    }
    
    // Check if there's already an in-flight request for this invoice
    const inflightKey = `inflight_${invoiceId}`;
    const inflightRequest = MayarPaymentService.inflightRequests.get(inflightKey);
    
    if (inflightRequest) {
      safeLog.info('Waiting for in-flight transaction request');
      return inflightRequest as Promise<unknown[]>;
    }
    
    // Create new request
    const requestPromise = this.fetchMayarTransactions(invoiceId);
    
    // Store in-flight request
    MayarPaymentService.inflightRequests.set(inflightKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache the result
      MayarPaymentService.transactionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      
      return result;
    } finally {
      // Remove from in-flight requests
      MayarPaymentService.inflightRequests.delete(inflightKey);
    }
  }
  
  /**
   * Fetch transactions from Mayar API with retry logic
   * @param invoiceId - Mayar invoice ID to search for
   * @returns Array of matching transactions
   */
  private async fetchMayarTransactions(invoiceId: string): Promise<unknown[]> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Call Mayar API to get latest transactions
        const response = await this.callMayarAPI("/transactions", "GET");
        
        // Extract transactions from response
        // Mayar API returns { data: [...] } structure
        const responseData = response.data as { data?: unknown[] } | unknown[];
        const transactions = Array.isArray(responseData) 
          ? responseData 
          : (responseData as { data?: unknown[] })?.data || [];

        safeLog.info(`Found ${transactions.length} total transactions from API`);

        // Filter transactions by invoice ID
        // Mayar transactions can match on either paymentLinkId or paymentLinkTransactionId
        const matchingTransactions = transactions.filter((t: unknown) => {
          const transaction = t as Record<string, unknown>;
          return (
            transaction.paymentLinkId === invoiceId ||
            transaction.paymentLinkTransactionId === invoiceId
          );
        });

        safeLog.info(`Found ${matchingTransactions.length} matching transactions`);

        return matchingTransactions;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        // Don't retry on rate limit errors (429)
        if (lastError.message.includes("429")) {
          safeLog.error('Rate limit hit for transaction query');
          throw lastError;
        }
        
        // Log retry attempt
        if (attempt < maxRetries) {
          const backoffDelay = 1000 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s
          safeLog.info(`Retry ${attempt + 1}/${maxRetries} after ${backoffDelay}ms`);
          
          // Wait before retrying with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // All retries failed
    safeLog.error(`Failed after ${maxRetries} retries`, lastError);
    throw lastError || new Error("Failed to query Mayar transactions");
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
          const error = new Error(
            `Mayar API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
          
          // Don't retry on rate limit (429) or client errors (4xx)
          if (response.status === 429 || (response.status >= 400 && response.status < 500)) {
            throw error;
          }
          
          throw error;
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Don't retry on rate limit (429) or client errors (4xx)
        if (error instanceof Error && (
          error.message.includes("429") || 
          error.message.includes("400") ||
          error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("404")
        )) {
          throw error;
        }

        // Retry on server errors (5xx) or network errors with exponential backoff
        if (attempt < this.maxRetries - 1) {
          const backoffDelay = this.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    throw lastError || new Error("Failed to call Mayar API after retries");
  }
}
