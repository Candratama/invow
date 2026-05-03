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
      // Read env at call time so vitest beforeEach can override the module-level constants.
      const apiKey = process.env.MAYAR_API_KEY ?? MAYAR_API_KEY;
      if (!apiKey) {
        throw new Error("MAYAR_API_KEY is not configured");
      }

      // Idempotency: reuse a pending payment for the same (user, tier) created
      // within 5 minutes. Prevents double-click / rapid retry from creating
      // duplicate Mayar invoices.
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existing } = await this.supabase
        .from("payment_transactions")
        .select("id, mayar_invoice_id, payment_url, amount")
        .eq("user_id", userId)
        .eq("tier", tier)
        .eq("status", "pending")
        .gte("created_at", fiveMinAgo)
        .maybeSingle();

      if (existing && existing.mayar_invoice_id && existing.payment_url) {
        safeLog.payment("Reusing pending invoice", { paymentId: existing.id });
        return {
          data: {
            invoiceId: existing.mayar_invoice_id as string,
            paymentUrl: existing.payment_url as string,
            amount: existing.amount as number,
          },
          error: null,
        };
      }

      // Fetch price from database
      const { data: planData, error: planError } = await this.supabase
        .from("subscription_plans")
        .select("price")
        .eq("tier", tier)
        .eq("is_active", true)
        .single();

      if (planError || !planData) {
        throw new Error(`Invalid tier or plan not found: ${tier}`);
      }

      const amount = planData.price;
      if (!amount || amount <= 0) {
        throw new Error(`Invalid price for tier: ${tier}`);
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
          payment_url: paymentUrl,
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
   * Fetch single invoice from Mayar by invoice ID.
   * Returns the raw Mayar invoice payload (status, amount, customer, etc).
   * Avoids the deprecated "fetch all transactions and filter" path.
   */
  async getInvoiceById(
    invoiceId: string,
  ): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
    try {
      // Read env at call time so vitest beforeEach can override the module-level constants.
      const apiKey = process.env.MAYAR_API_KEY ?? MAYAR_API_KEY;
      const apiUrl = process.env.MAYAR_API_URL ?? MAYAR_API_URL;
      if (!apiKey) {
        throw new Error("MAYAR_API_KEY is not configured");
      }
      const url = `${apiUrl}/invoice/${invoiceId}`;
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        return {
          data: null,
          error: new Error(`Mayar invoice fetch failed (${resp.status}): ${body}`),
        };
      }
      const json = (await resp.json()) as { data?: Record<string, unknown> };
      return { data: json.data ?? null, error: null };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e : new Error("Unknown Mayar fetch error"),
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
    options?: { source?: "redirect" | "cron" },
  ): Promise<{
    data?: { subscription: { tier: string; expiresAt: string } };
    error?: Error;
  }> {
    const source = options?.source ?? "redirect";
    try {
      safeLog.payment("Verification started", { invoiceId });
      safeLog.info(`Verification source: ${source}`);

      const { data: payment, error: findError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("mayar_invoice_id", invoiceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (findError) {
        return { error: new Error("Failed to query payment record") };
      }
      if (!payment) {
        return { error: new Error("Payment record not found") };
      }

      // Idempotent: already completed → return current subscription
      if (payment.status === "completed") {
        const { data: subscription } = await this.supabase
          .from("user_subscriptions")
          .select("tier, subscription_end_date")
          .eq("user_id", userId)
          .single();
        if (!subscription) {
          return { error: new Error("Subscription not found") };
        }
        return {
          data: {
            subscription: {
              tier: subscription.tier,
              expiresAt: subscription.subscription_end_date || "",
            },
          },
        };
      }

      // Direct invoice fetch
      const { data: invoice, error: fetchErr } =
        await this.getInvoiceById(invoiceId);

      if (fetchErr || !invoice) {
        return { error: fetchErr ?? new Error("Empty invoice payload") };
      }

      const nowIso = new Date().toISOString();

      // Bump poll counters only after a successful Mayar response, so a flapping
      // upstream doesn't burn the cron throttle budget on rows we never confirmed.
      await this.supabase
        .from("payment_transactions")
        .update({
          last_polled_at: nowIso,
          poll_count: (payment.poll_count ?? 0) + 1,
        })
        .eq("id", payment.id);

      const status = String(invoice.status ?? "").toLowerCase();
      const paidStates = new Set(["paid", "completed", "settled"]);
      if (!paidStates.has(status)) {
        return {
          error: new Error(
            `Payment is ${status || "pending"}. Please complete the payment first.`,
          ),
        };
      }

      // Race-safe completion: only update if still pending
      const { data: completed } = await this.supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          mayar_transaction_id: invoice.transactionId as string,
          payment_method: invoice.paymentMethod as string,
          completed_at: nowIso,
          verified_at: nowIso,
          verified_via: source,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (!completed) {
        // Another worker (cron or redirect) already flipped this row and ran
        // upgradeToTier. Skip the upgrade to avoid double-extending the
        // subscription end date or stacking invoice_limit credits.
        safeLog.info("Payment already completed by another worker; skipping upgrade");
        const { data: existingSubscription } = await this.supabase
          .from("user_subscriptions")
          .select("tier, subscription_end_date")
          .eq("user_id", userId)
          .single();
        if (!existingSubscription) {
          return { error: new Error("Subscription not found after race") };
        }
        return {
          data: {
            subscription: {
              tier: existingSubscription.tier,
              expiresAt: existingSubscription.subscription_end_date || "",
            },
          },
        };
      }

      // This worker won the CAS — perform the upgrade exactly once.
      const { SubscriptionService } = await import("./subscription.service");
      const subscriptionService = new SubscriptionService(this.supabase);
      const { success, error: upgradeError } =
        await subscriptionService.upgradeToTier(userId, completed.tier);
      if (upgradeError || !success) {
        return {
          error: new Error(
            "Payment verified but subscription upgrade failed. Please contact support.",
          ),
        };
      }

      const { data: updatedSubscription } = await this.supabase
        .from("user_subscriptions")
        .select("tier, subscription_end_date")
        .eq("user_id", userId)
        .single();
      if (!updatedSubscription) {
        return { error: new Error("Failed to retrieve updated subscription") };
      }
      safeLog.payment("Verification success", {
        invoiceId,
        tier: updatedSubscription.tier,
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
      return {
        error: error instanceof Error ? error : new Error("Unexpected error"),
      };
    }
  }

  /**
   * @deprecated Replaced by `getInvoiceById` for the redirect-first verification flow.
   * Slated for removal once the cron path is observed stable for ≥1 week.
   * Do not call from new code.
   *
   * Query Mayar transactions by invoice ID with caching and deduplication.
   * Fetches transactions from Mayar API and filters by invoice ID.
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
