/**
 * Cached data fetching for pricing/subscription plans
 * Uses React cache() for request deduplication
 * 
 * Requirements: 6.1, 6.4
 */
import { cache } from "react";
import {
  getSubscriptionPlans as fetchSubscriptionPlans,
  SubscriptionPlan,
} from "@/lib/db/data-access/subscription-plans";

/**
 * Get subscription plans with React cache() for deduplication
 * When called multiple times within a single request, the underlying
 * fetch will execute only once.
 * 
 * @param includeInactive - Whether to include inactive plans (default: false)
 * @returns Promise<SubscriptionPlan[]> - Array of subscription plans
 */
export const getSubscriptionPlans = cache(
  async (includeInactive = false): Promise<SubscriptionPlan[]> => {
    const result = await fetchSubscriptionPlans(includeInactive);
    return result.data || [];
  }
);

/**
 * Get only active subscription plans (convenience wrapper)
 * Cached separately from the full list for optimal deduplication
 */
export const getActiveSubscriptionPlans = cache(
  async (): Promise<SubscriptionPlan[]> => {
    const result = await fetchSubscriptionPlans(false);
    return result.data || [];
  }
);
