/**
 * Settings Service
 * Handles CRUD operations for user_settings table
 */

import { createClient } from "@/lib/supabase/client";
import type {
  UserSettings,
  UserSettingsInsert,
  UserSettingsUpdate,
} from "@/lib/db/database.types";

export class SettingsService {
  private supabase = createClient();

  /**
   * Get user settings for the authenticated user
   * @returns User settings or null if not found
   */
  async getSettings(): Promise<{
    data: UserSettings | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("user_settings")
        .select("*")
        .single();

      if (error) {
        // If no settings found (PGRST116), return null instead of error
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
   * Create new user settings
   * @param settings - Settings data to insert
   * @returns Created settings
   */
  async createSettings(settings: Omit<UserSettingsInsert, "user_id">): Promise<{
    data: UserSettings | null;
    error: Error | null;
  }> {
    try {
      // Get user with retry logic (for cases where auth session is being established)
      let user = null;
      let retries = 0;
      const maxRetries = 3;

      while (!user && retries < maxRetries) {
        const {
          data: { user: currentUser },
        } = await this.supabase.auth.getUser();

        if (currentUser) {
          user = currentUser;
        } else if (retries < maxRetries - 1) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries++;
        } else {
          throw new Error("User not authenticated");
        }
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_settings")
        .insert({
          ...settings,
          user_id: user.id,
        })
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
   * Update existing user settings
   * @param settings - Settings data to update
   * @returns Updated settings
   */
  async updateSettings(settings: UserSettingsUpdate): Promise<{
    data: UserSettings | null;
    error: Error | null;
  }> {
    try {
      // Get user with retry logic (for cases where auth session is being established)
      let user = null;
      let retries = 0;
      const maxRetries = 3;

      while (!user && retries < maxRetries) {
        const {
          data: { user: currentUser },
        } = await this.supabase.auth.getUser();

        if (currentUser) {
          user = currentUser;
        } else if (retries < maxRetries - 1) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries++;
        } else {
          throw new Error("User not authenticated");
        }
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("user_settings")
        .update(settings)
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
   * Upsert user settings (insert or update)
   * @param settings - Settings data to upsert
   * @returns Upserted settings
   */
  async upsertSettings(settings: Omit<UserSettingsInsert, "user_id">): Promise<{
    data: UserSettings | null;
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
        .from("user_settings")
        .upsert(
          {
            ...settings,
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
   * Delete user settings
   * @returns Success status
   */
  async deleteSettings(): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await this.supabase
        .from("user_settings")
        .delete()
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

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
export const settingsService = new SettingsService();
