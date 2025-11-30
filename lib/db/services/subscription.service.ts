/**
 * Subscription Service
 * Handles user subscription management and invoice limit enforcement
 */

import type { UserSubscription } from "@/lib/db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SubscriptionStatus {
  tier: string;
  invoiceLimit: number;
  currentMonthCount: number;
  remainingInvoices: number;
  monthYear: string;
  resetDate: Date;
}

import { TIER_LIMITS } from "@/lib/config/pricing";

export class SubscriptionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's current subscription
   * @param userId - User ID
   * @returns User subscription or null if not found
   */
  async getUserSubscription(userId: string): Promise<{
    data: UserSubscription | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If not found, return null instead of error
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        throw new Error(error.message);
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get or create default subscription for user
   * @param userId - User ID
   * @returns User subscription
   */
  async getOrCreateSubscription(userId: string): Promise<{
    data: UserSubscription | null;
    error: Error | null;
  }> {
    try {
      // Try to get existing subscription
      const { data: existing } = await this.getUserSubscription(userId);

      if (existing) {
        return { data: existing, error: null };
      }

      // Create default free tier subscription
      const now = new Date();
      const subscriptionStartDate = now.toISOString();
      const currentCycle = this.getCurrentBillingCycle(now);

      const { data, error } = await this.supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          tier: "free",
          invoice_limit: TIER_LIMITS.free,
          current_month_count: 0,
          month_year: currentCycle,
          subscription_start_date: subscriptionStartDate,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Upgrade user to a paid tier
   * @param userId - User ID
   * @param tier - Target tier ('starter')
   * @returns Success status
   */
  async upgradeToTier(userId: string, tier: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
      if (!limit) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      // Get or create subscription first
      const { data: subscription, error: getError } =
        await this.getOrCreateSubscription(userId);

      if (getError || !subscription) {
        throw new Error(
          getError?.message || "Failed to get or create subscription",
        );
      }

      const now = new Date();
      let newStartDate: string;
      let newEndDate: string;
      let newInvoiceLimit: number;
      let newCurrentCount: number;

      // Calculate remaining credits (unused invoices)
      const remainingCredits = Math.max(
        0,
        subscription.invoice_limit - subscription.current_month_count
      );

      // Check if user has an active subscription
      if (subscription.subscription_end_date) {
        const currentEndDate = new Date(subscription.subscription_end_date);
        
        // If subscription is still active (end date is in the future)
        if (currentEndDate > now) {
          // Extend from current end date (add 30 days)
          const extendedEndDate = new Date(currentEndDate);
          extendedEndDate.setDate(extendedEndDate.getDate() + 30);
          
          newStartDate = subscription.subscription_start_date; // Keep original start date
          newEndDate = extendedEndDate.toISOString();
          
          // Accumulate credits: remaining + new limit
          newInvoiceLimit = remainingCredits + limit;
          newCurrentCount = 0; // Reset count since we're adding new credits
          
          // Extending subscription (detailed logs only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log(`Extending subscription: ${remainingCredits} + ${limit} = ${newInvoiceLimit} credits`);
          }
        } else {
          // Subscription expired, start new 30-day period from now
          newStartDate = now.toISOString();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 30);
          newEndDate = endDate.toISOString();
          
          // No remaining credits since subscription expired
          newInvoiceLimit = limit;
          newCurrentCount = 0;
          
          // Starting new subscription (no user ID logged)
        }
      } else {
        // No end date set, start new 30-day period from now
        newStartDate = now.toISOString();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);
        newEndDate = endDate.toISOString();
        
        // First time subscription
        newInvoiceLimit = limit;
        newCurrentCount = 0;
        
        // Starting first subscription (no user ID logged)
      }

      const newCycle = this.getCurrentBillingCycle(new Date(newStartDate));

      // Update subscription tier with new dates and accumulated credits
      const { error: updateError } = await this.supabase
        .from("user_subscriptions")
        .update({
          tier,
          invoice_limit: newInvoiceLimit,
          subscription_start_date: newStartDate,
          subscription_end_date: newEndDate,
          current_month_count: newCurrentCount,
          month_year: newCycle,
        })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(updateError.message);
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
   * Check if user can generate an invoice
   * @param userId - User ID
   * @returns True if user can generate invoice
   */
  async canGenerateInvoice(userId: string): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      // Get or create subscription
      const { data: subscription, error: getError } =
        await this.getOrCreateSubscription(userId);

      if (getError || !subscription) {
        throw new Error(
          getError?.message || "Failed to get or create subscription",
        );
      }

      const subscriptionStartDate = new Date(subscription.subscription_start_date);
      
      // Check if billing cycle has changed based on subscription start date
      const currentCycle = this.getCurrentBillingCycle(subscriptionStartDate);
      if (subscription.month_year !== currentCycle) {
        // Reset counter for new billing cycle
        await this.resetMonthlyCounter(userId, currentCycle);
        subscription.current_month_count = 0;
      }

      const canGenerate =
        subscription.current_month_count < subscription.invoice_limit;

      return { data: canGenerate, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Increment invoice count for user
   * @param userId - User ID
   * @returns Updated count
   */
  async incrementInvoiceCount(userId: string): Promise<{
    data: number | null;
    error: Error | null;
  }> {
    try {
      // Get current subscription
      const { data: subscription, error: getError } =
        await this.getUserSubscription(userId);

      if (getError || !subscription) {
        throw new Error(
          getError?.message || "Subscription not found",
        );
      }

      const subscriptionStartDate = new Date(subscription.subscription_start_date);
      
      // Check if billing cycle has changed based on subscription start date
      const currentCycle = this.getCurrentBillingCycle(subscriptionStartDate);
      if (subscription.month_year !== currentCycle) {
        // Reset counter for new billing cycle
        await this.resetMonthlyCounter(userId, currentCycle);
      }

      // Increment count
      const { data, error } = await this.supabase
        .from("user_subscriptions")
        .update({
          current_month_count: subscription.current_month_count + 1,
          month_year: currentCycle,
        })
        .eq("user_id", userId)
        .select("current_month_count")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data: data?.current_month_count ?? null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get remaining invoices for user
   * @param userId - User ID
   * @returns Remaining invoice count
   */
  async getRemainingInvoices(userId: string): Promise<{
    data: number | null;
    error: Error | null;
  }> {
    try {
      // Get or create subscription
      const { data: subscription, error: getError } =
        await this.getOrCreateSubscription(userId);

      if (getError || !subscription) {
        throw new Error(
          getError?.message || "Failed to get or create subscription",
        );
      }

      const subscriptionStartDate = new Date(subscription.subscription_start_date);
      
      // Check if billing cycle has changed based on subscription start date
      const currentCycle = this.getCurrentBillingCycle(subscriptionStartDate);
      if (subscription.month_year !== currentCycle) {
        // Reset counter for new billing cycle
        await this.resetMonthlyCounter(userId, currentCycle);
        subscription.current_month_count = 0;
      }

      const remaining =
        subscription.invoice_limit - subscription.current_month_count;

      return { data: Math.max(0, remaining), error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get subscription status with all details
   * @param userId - User ID
   * @returns Subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<{
    data: SubscriptionStatus | null;
    error: Error | null;
  }> {
    try {
      // Get or create subscription
      const { data: subscription, error: getError } =
        await this.getOrCreateSubscription(userId);

      if (getError || !subscription) {
        throw new Error(
          getError?.message || "Failed to get or create subscription",
        );
      }

      const subscriptionStartDate = new Date(subscription.subscription_start_date);
      
      // Check if billing cycle has changed based on subscription start date
      const currentCycle = this.getCurrentBillingCycle(subscriptionStartDate);
      if (subscription.month_year !== currentCycle) {
        // Reset counter for new billing cycle
        await this.resetMonthlyCounter(userId, currentCycle);
        subscription.current_month_count = 0;
        subscription.month_year = currentCycle;
      }

      const remaining =
        subscription.invoice_limit - subscription.current_month_count;
      
      // For paid tiers (starter), use subscription_end_date as reset date
      // For free tier, use billing cycle reset date
      let resetDate: Date;
      if (subscription.subscription_end_date && subscription.tier !== 'free') {
        // Paid subscription - credits expire on subscription_end_date
        resetDate = new Date(subscription.subscription_end_date);
      } else {
        // Free tier - resets on billing cycle
        resetDate = this.getNextResetDate(subscriptionStartDate);
      }

      return {
        data: {
          tier: subscription.tier,
          invoiceLimit: subscription.invoice_limit,
          currentMonthCount: subscription.current_month_count,
          remainingInvoices: Math.max(0, remaining),
          monthYear: currentCycle,
          resetDate,
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
   * Reset monthly counter for all users (deprecated - billing cycles are now per-user)
   * This method is kept for backward compatibility but should not be used
   * @returns Success status
   */
  async resetAllMonthlyCounters(): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // Note: This method is deprecated as billing cycles are now per-user
      // based on their subscription_start_date. Each user's counter resets
      // automatically when their billing cycle changes.
      console.warn('resetAllMonthlyCounters is deprecated - billing cycles are now per-user');
      
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Reset monthly counter for a specific user
   * @param userId - User ID
   * @param billingCycle - Billing cycle identifier
   * @returns Success status
   */
  private async resetMonthlyCounter(userId: string, billingCycle: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("user_subscriptions")
        .update({
          current_month_count: 0,
          month_year: billingCycle,
        })
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
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
   * Get current billing cycle identifier based on subscription start date
   * Format: YYYY-MM-DD where DD is the subscription start day
   * Example: If user registered on 2024-01-15, billing cycles are:
   * - 2024-01-15 to 2024-02-14: cycle "2024-01-15"
   * - 2024-02-15 to 2024-03-14: cycle "2024-02-15"
   * @param subscriptionStartDate - User's subscription start date
   * @returns Billing cycle identifier
   */
  private getCurrentBillingCycle(subscriptionStartDate: Date): string {
    const now = new Date();
    const startDay = subscriptionStartDate.getDate();
    const currentDay = now.getDate();

    let cycleYear = now.getFullYear();
    let cycleMonth = now.getMonth();

    // If current day is before the billing day, we're still in the previous cycle
    if (currentDay < startDay) {
      cycleMonth -= 1;
      if (cycleMonth < 0) {
        cycleMonth = 11;
        cycleYear -= 1;
      }
    }

    const year = cycleYear;
    const month = String(cycleMonth + 1).padStart(2, "0");
    const day = String(startDay).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Get next billing cycle reset date based on subscription start date
   * @param subscriptionStartDate - User's subscription start date
   * @returns Next reset date
   */
  private getNextResetDate(subscriptionStartDate: Date): Date {
    const now = new Date();
    const startDay = subscriptionStartDate.getDate();

    // Create a date for this month's reset day
    const thisMonthReset = new Date(
      now.getFullYear(),
      now.getMonth(),
      startDay,
    );

    // If we've already passed this month's reset day, return next month's reset
    if (now >= thisMonthReset) {
      return new Date(now.getFullYear(), now.getMonth() + 1, startDay);
    }

    return thisMonthReset;
  }
}
