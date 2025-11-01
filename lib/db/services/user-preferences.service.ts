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
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();
