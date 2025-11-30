/**
 * Tier Service
 * Handles feature access control based on user subscription tier
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { TIER_FEATURES, type TierFeatures } from "@/lib/config/pricing";

export type FeatureName = keyof TierFeatures;

export interface HistoryLimit {
  limit: number;
  type: 'count' | 'days';
}

export class TierService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's current tier
   * @param userId - User ID
   * @returns User's tier ('free' or 'premium')
   */
  async getUserTier(userId: string): Promise<{
    data: string;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("user_subscriptions")
        .select("tier, subscription_end_date")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If not found, default to free tier
        if (error.code === "PGRST116") {
          return { data: "free", error: null };
        }
        throw new Error(error.message);
      }

      // Check if premium subscription has expired
      if (data.tier === "premium" && data.subscription_end_date) {
        const endDate = new Date(data.subscription_end_date);
        const now = new Date();
        if (endDate < now) {
          // Subscription expired, treat as free
          return { data: "free", error: null };
        }
      }

      return { data: data.tier, error: null };
    } catch (error) {
      return {
        data: "free", // Default to free on error
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get features available for user's tier
   * @param userId - User ID
   * @returns TierFeatures object for user's tier
   */
  async getUserFeatures(userId: string): Promise<{
    data: TierFeatures;
    error: Error | null;
  }> {
    try {
      const { data: tier, error: tierError } = await this.getUserTier(userId);

      if (tierError) {
        // Return free tier features on error
        return { data: TIER_FEATURES.free, error: tierError };
      }

      const features = TIER_FEATURES[tier];
      if (!features) {
        // Unknown tier, default to free
        return { data: TIER_FEATURES.free, error: null };
      }

      return { data: features, error: null };
    } catch (error) {
      return {
        data: TIER_FEATURES.free,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Check if user can access a specific feature
   * @param userId - User ID
   * @param feature - Feature name to check
   * @returns Boolean indicating if user can access the feature
   */
  async canAccessFeature(userId: string, feature: FeatureName): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      const { data: features, error } = await this.getUserFeatures(userId);

      if (error) {
        return { data: false, error };
      }

      const value = features[feature];

      // Handle different feature value types
      if (typeof value === "boolean") {
        return { data: value, error: null };
      }

      if (typeof value === "number") {
        return { data: value > 0, error: null };
      }

      if (Array.isArray(value)) {
        return { data: value.length > 0, error: null };
      }

      // For string type (historyType), always return true
      return { data: true, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get history limit configuration for user's tier
   * @param userId - User ID
   * @returns History limit configuration with limit value and type
   */
  async getHistoryLimit(userId: string): Promise<{
    data: HistoryLimit;
    error: Error | null;
  }> {
    try {
      const { data: features, error } = await this.getUserFeatures(userId);

      if (error) {
        // Default to free tier limits on error
        return {
          data: {
            limit: TIER_FEATURES.free.historyLimit,
            type: TIER_FEATURES.free.historyType,
          },
          error,
        };
      }

      return {
        data: {
          limit: features.historyLimit,
          type: features.historyType,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: {
          limit: TIER_FEATURES.free.historyLimit,
          type: TIER_FEATURES.free.historyType,
        },
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Check if user has premium tier (active subscription)
   * @param userId - User ID
   * @returns Boolean indicating if user has premium tier
   */
  async isPremium(userId: string): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      const { data: tier, error } = await this.getUserTier(userId);

      if (error) {
        return { data: false, error };
      }

      return { data: tier === "premium", error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get available templates count for user's tier
   * @param userId - User ID
   * @returns Number of templates available
   */
  async getAvailableTemplateCount(userId: string): Promise<{
    data: number;
    error: Error | null;
  }> {
    try {
      const { data: features, error } = await this.getUserFeatures(userId);

      if (error) {
        return { data: TIER_FEATURES.free.templateCount, error };
      }

      return { data: features.templateCount, error: null };
    } catch (error) {
      return {
        data: TIER_FEATURES.free.templateCount,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get available export qualities for user's tier
   * @param userId - User ID
   * @returns Array of available export quality options
   */
  async getAvailableExportQualities(userId: string): Promise<{
    data: string[];
    error: Error | null;
  }> {
    try {
      const { data: features, error } = await this.getUserFeatures(userId);

      if (error) {
        return { data: TIER_FEATURES.free.exportQualities, error };
      }

      return { data: features.exportQualities, error: null };
    } catch (error) {
      return {
        data: TIER_FEATURES.free.exportQualities,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
