/**
 * User Preferences Service
 * Handles CRUD operations for user_preferences table
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserPreferences,
  UserPreferencesInsert,
  UserPreferencesUpdate,
} from "@/lib/db/database.types";
import type { InvoiceTemplateId } from "@/components/features/invoice/templates";

export class UserPreferencesService {
  constructor(private supabase: SupabaseClient) {}

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
   * Returns default values: export_quality_kb = 50, tax_enabled = false, tax_percentage = null
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
          // Default template is "simple" for free users (Requirements: free tier default)
          const defaults: UserPreferences = {
            id: "",
            user_id: user.id,
            preferred_language: "en",
            timezone: "UTC",
            date_format: "YYYY-MM-DD",
            currency: "USD",
            default_store_id: null,
            export_quality_kb: 50,
            tax_enabled: false,
            tax_percentage: null,
            selected_template: "simple",
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

  /**
   * Get selected invoice template for the authenticated user
   * Returns 'simple' as default if no preference is set (free tier default)
   */
  async getSelectedTemplate(): Promise<{
    data: InvoiceTemplateId;
    error: Error | null;
  }> {
    try {
      const { data: preferences, error } = await this.getUserPreferences();

      if (error) throw error;

      return { 
        data: preferences.selected_template as InvoiceTemplateId, 
        error: null 
      };
    } catch (error) {
      return {
        data: "simple",
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update selected invoice template
   * Validates that template is one of the available templates
   */
  async updateSelectedTemplate(
    template: InvoiceTemplateId
  ): Promise<{
    data: UserPreferences | null;
    error: Error | null;
  }> {
    try {
      // Validate template value
      const validTemplates: InvoiceTemplateId[] = [
        'classic', 'simple', 'modern', 'elegant', 
        'bold', 'compact', 'creative', 'corporate'
      ];
      
      if (!validTemplates.includes(template)) {
        throw new Error(
          `Invalid template. Must be one of: ${validTemplates.join(', ')}`
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
        .update({ selected_template: template })
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
