/**
 * User Preferences Service
 * Handles CRUD operations for user_preferences table
 */

import { createClient } from "@/lib/supabase/client";
import type {
  UserPreferences,
  UserPreferencesInsert,
  UserPreferencesUpdate,
} from "@/lib/db/database.types";

export class UserPreferencesService {
  private supabase = createClient();

  /**
   * Get user preferences for the authenticated user
   */
  async getPreferences(): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
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
   * Get user preferences with default values if not found
   * Returns default values: export_quality_kb = 100, tax_enabled = false, tax_percentage = null
   */
  async getUserPreferences(): Promise<{
    data: UserPreferences;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No preferences found, return defaults
          const defaults: UserPreferences = {
            id: "",
            user_id: user.id,
            preferred_language: "en",
            timezone: "UTC",
            date_format: "YYYY-MM-DD",
            currency: "USD",
            default_store_id: null,
            export_quality_kb: 100,
            tax_enabled: false,
            tax_percentage: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return { data: defaults, error: null };
        }
        throw new Error(error.message);
      }

      return { data, error: null };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error");
    }
  }

  /**
   * Create or update user preferences (upsert)
   */
  async upsertPreferences(
    preferences: Omit<UserPreferencesInsert, "user_id">,
  ): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_preferences")
        .upsert(
          {
            ...preferences,
            user_id: user.id,
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    updates: UserPreferencesUpdate,
  ): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Set default store for user
   */
  async setDefaultStore(storeId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await this.updatePreferences({
        default_store_id: storeId,
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update export quality preference
   * Validates that quality is 50, 100, or 150
   */
  async updateExportQuality(quality: 50 | 100 | 150): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      // Validate quality value
      if (quality !== 50 && quality !== 100 && quality !== 150) {
        throw new Error(
          "Export quality must be Small (50KB), Medium (100KB), or High (150KB)"
        );
      }

      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_preferences")
        .update({ export_quality_kb: quality })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update tax settings
   * Validates tax percentage is between 0 and 100
   * Sets tax_percentage to null when disabled
   */
  async updateTaxSettings(
    enabled: boolean,
    percentage?: number
  ): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      // Validate tax percentage if provided
      if (enabled && percentage !== undefined) {
        if (percentage < 0 || percentage > 100) {
          throw new Error("Tax percentage must be between 0 and 100");
        }
      }

      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Set tax_percentage to null when disabled
      const updateData: UserPreferencesUpdate = {
        tax_enabled: enabled,
        tax_percentage: enabled ? (percentage ?? 0) : null,
      };

      const { data, error } = await this.supabase
        .from("user_preferences")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();
