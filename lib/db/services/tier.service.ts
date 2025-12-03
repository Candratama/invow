/**
 * Tier Service
 * Handles feature access control based on user subscription tier
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface TierFeatures {
  invoiceLimit: number;
  templateCount: number;
  hasLogo: boolean;
  hasSignature: boolean;
  hasCustomColors: boolean;
  historyLimit: number;
  historyType: 'count' | 'days';
  hasDashboardTotals: boolean;
  exportQualities: string[];
  hasMonthlyReport: boolean;
}

export type FeatureName = keyof TierFeatures;

export interface HistoryLimit {
  limit: number;
  type: 'count' | 'days';
}

// Default free tier features as fallback
const DEFAULT_FREE_FEATURES: TierFeatures = {
  invoiceLimit: 10,
  templateCount: 1,
  hasLogo: false,
  hasSignature: false,
  hasCustomColors: false,
  historyLimit: 10,
  historyType: 'count',
  hasDashboardTotals: false,
  exportQualities: ['standard'],
  hasMonthlyReport: false,
};

export class TierService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get tier features from database
   * @param tier - Tier name
   * @returns TierFeatures object
   */
  private async getTierFeaturesFromDB(tier: string): Promise<TierFeatures> {
    const { data } = await this.supabase
      .from("subscription_plans")
      .select("*")
      .eq("tier", tier)
      .eq("is_active", true)
      .single();

    if (!data) {
      return DEFAULT_FREE_FEATURES;
    }

    // Map database fields to TierFeatures
    return {
      invoiceLimit: data.invoice_limit,
      templateCount: data.features.includes("premium templates") ? 3 : 1,
      hasLogo: data.features.some((f: string) => f.toLowerCase().includes("logo")),
      hasSignature: data.features.some((f: string) => f.toLowerCase().includes("signature")),
      hasCustomColors: data.features.some((f: string) => f.toLowerCase().includes("color")),
      historyLimit: tier === "premium" ? 30 : 10,
      historyType: tier === "premium" ? "days" : "count",
      hasDashboardTotals: data.features.some((f: string) => f.toLowerCase().includes("dashboard")),
      exportQualities: tier === "premium" ? ["standard", "high", "print-ready"] : ["standard"],
      hasMonthlyReport: data.features.some((f: string) => f.toLowerCase().includes("report")),
    };
  }

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
        return { data: DEFAULT_FREE_FEATURES, error: tierError };
      }

      const features = await this.getTierFeaturesFromDB(tier);
      return { data: features, error: null };
    } catch (error) {
      return {
        data: DEFAULT_FREE_FEATURES,
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
            limit: DEFAULT_FREE_FEATURES.historyLimit,
            type: DEFAULT_FREE_FEATURES.historyType,
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
          limit: DEFAULT_FREE_FEATURES.historyLimit,
          type: DEFAULT_FREE_FEATURES.historyType,
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
        return { data: DEFAULT_FREE_FEATURES.templateCount, error };
      }

      return { data: features.templateCount, error: null };
    } catch (error) {
      return {
        data: DEFAULT_FREE_FEATURES.templateCount,
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
        return { data: DEFAULT_FREE_FEATURES.exportQualities, error };
      }

      return { data: features.exportQualities, error: null };
    } catch (error) {
      return {
        data: DEFAULT_FREE_FEATURES.exportQualities,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
