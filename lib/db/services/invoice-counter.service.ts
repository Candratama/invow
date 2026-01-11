/**
 * Invoice Counter Service
 * Handles billing cycle invoice usage tracking and limit enforcement
 * Billing cycles are based on user's subscription start date (e.g., if registered on 15th, resets on 15th each month)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export class InvoiceCounterService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get current billing cycle invoice count for user
   * @param userId - User ID
   * @param subscriptionStartDate - User's subscription start date
   * @returns Current billing cycle invoice count
   */
  async getCurrentMonthCount(
    userId: string,
    subscriptionStartDate: Date,
  ): Promise<{
    data: number | null;
    error: Error | null;
  }> {
    try {
      const billingCycle = this.getCurrentBillingCycle(subscriptionStartDate);

      const { data, error } = await this.supabase
        .from("invoice_usage")
        .select("invoice_count, month_year")
        .eq("user_id", userId)
        .eq("month_year", billingCycle)
        .single();

      if (error) {
        // If not found, return 0 instead of error
        if (error.code === "PGRST116") {
          return { data: 0, error: null };
        }
        throw new Error(error.message);
      }

      return { data: data?.invoice_count ?? 0, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Increment invoice count for current billing cycle
   * Automatically handles billing cycle transitions based on subscription start date
   * @param userId - User ID
   * @param subscriptionStartDate - User's subscription start date
   * @returns Updated count
   */
  async incrementCount(
    userId: string,
    subscriptionStartDate: Date,
  ): Promise<{
    data: number | null;
    error: Error | null;
  }> {
    try {
      const billingCycle = this.getCurrentBillingCycle(subscriptionStartDate);

      // Get current count and check for billing cycle transition
      const { data: existing, error: getError } = await this.supabase
        .from("invoice_usage")
        .select("invoice_count, month_year")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let newCount = 1;

      if (getError) {
        // If not found, create new record
        if (getError.code === "PGRST116") {
          const { data: insertData, error: insertError } = await this.supabase
            .from("invoice_usage")
            .insert({
              user_id: userId,
              month_year: billingCycle,
              invoice_count: 1,
            })
            .select("invoice_count")
            .single();

          if (insertError) {
            throw new Error(insertError.message);
          }

          return { data: insertData?.invoice_count ?? 1, error: null };
        }
        throw new Error(getError.message);
      }

      // Check if billing cycle has changed
      if (existing?.month_year !== billingCycle) {
        // Create new record for current billing cycle
        const { data: insertData, error: insertError } = await this.supabase
          .from("invoice_usage")
          .insert({
            user_id: userId,
            month_year: billingCycle,
            invoice_count: 1,
          })
          .select("invoice_count")
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        return { data: insertData?.invoice_count ?? 1, error: null };
      }

      // Same billing cycle, update existing record
      newCount = (existing?.invoice_count ?? 0) + 1;

      const { data: updateData, error: updateError } = await this.supabase
        .from("invoice_usage")
        .update({ invoice_count: newCount })
        .eq("user_id", userId)
        .eq("month_year", billingCycle)
        .select("invoice_count")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return { data: updateData?.invoice_count ?? newCount, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Reset billing cycle invoice count for a specific user
   * @param userId - User ID
   * @param subscriptionStartDate - User's subscription start date
   * @returns Success status
   */
  async resetMonthlyCount(
    userId: string,
    subscriptionStartDate: Date,
  ): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const billingCycle = this.getCurrentBillingCycle(subscriptionStartDate);

      const { error } = await this.supabase
        .from("invoice_usage")
        .update({ invoice_count: 0 })
        .eq("user_id", userId)
        .eq("month_year", billingCycle);

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
   * Check if user has reached their invoice limit for current billing cycle
   * @param userId - User ID
   * @param limit - Invoice limit for user's tier
   * @param subscriptionStartDate - User's subscription start date
   * @returns True if limit is reached
   */
  async isLimitReached(
    userId: string,
    limit: number,
    subscriptionStartDate: Date,
  ): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      const { data: count, error } = await this.getCurrentMonthCount(
        userId,
        subscriptionStartDate,
      );

      if (error) {
        throw error;
      }

      const isReached = (count ?? 0) >= limit;

      return { data: isReached, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Handle billing cycle transition - reset count if cycle has changed
   * @param userId - User ID
   * @param lastBillingCycle - Last recorded billing cycle
   * @param subscriptionStartDate - User's subscription start date
   * @returns True if billing cycle has changed and reset occurred
   */
  async handleBillingCycleTransition(
    userId: string,
    lastBillingCycle: string,
    subscriptionStartDate: Date,
  ): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      const currentCycle = this.getCurrentBillingCycle(subscriptionStartDate);

      // Check if billing cycle has changed
      if (lastBillingCycle === currentCycle) {
        return { data: false, error: null };
      }

      // Billing cycle has changed, create new record for current cycle
      const { error } = await this.supabase
        .from("invoice_usage")
        .insert({
          user_id: userId,
          month_year: currentCycle,
          invoice_count: 0,
        });

      if (error) {
        // If record already exists, just return success
        if (error.code === "23505") {
          return { data: true, error: null };
        }
        throw new Error(error.message);
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get next billing cycle reset date based on subscription start date
   * @param subscriptionStartDate - User's subscription start date
   * @returns Next reset date
   */
  getNextResetDate(subscriptionStartDate: Date): Date {
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
}
